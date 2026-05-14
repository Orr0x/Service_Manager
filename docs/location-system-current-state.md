# Location System Current State

Last updated: 2026-05-14

## Summary

The current start-job location gate does **not** use the job-site postcode or text address at the moment the worker presses **Start Job**.

The app compares two coordinate pairs:

- Worker location: captured from the worker device/browser with `navigator.geolocation`.
- Job-site location: read from the saved `job_sites.latitude` and `job_sites.longitude` fields.

The address, postcode, What3Words, Mapbox, TomTom, and Google Maps features are separate helpers or navigation/display features. They are not the source of truth for the start-job gate unless they have already been used to populate the saved latitude and longitude fields on the job site.

## Core Database Fields

Job-site coordinates are stored on `job_sites`:

- `latitude`
- `longitude`
- `what3words`

These fields were added in:

- `supabase/migrations/20251206000002_expand_job_sites.sql`

Attendance evidence is stored on `jobs`:

- `start_latitude`
- `start_longitude`
- `start_location_accuracy_meters`
- `start_distance_meters`
- `end_latitude`
- `end_longitude`
- `end_location_accuracy_meters`
- `end_distance_meters`
- `location_override_authorized`

These fields were added in:

- `supabase/migrations/20260509000000_add_job_attendance_payroll.sql`

Tenant-level gate settings are stored in:

- `tenant_settings.attendance_settings`

## How The Worker Start Job Button Determines Location

The worker job detail page is:

- `src/app/(worker)/worker/jobs/[id]/page.tsx`

When the worker presses **Start Job** or **Complete Job**, the page calls `getCurrentLocation()`.

That function uses the browser/device API:

```ts
navigator.geolocation.getCurrentPosition(resolve, reject, {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
})
```

The captured values sent to the server are:

- `position.coords.latitude`
- `position.coords.longitude`
- `position.coords.accuracy`

The browser decides how to get the device location. On a phone this is usually GPS plus platform location services. On a desktop it may use Wi-Fi/IP-based location, so it can be much less accurate. This explains why mobile testing can pass while desktop testing reports being hundreds or thousands of metres away.

If geolocation is unavailable, denied, or times out, the client sends no location. The server then decides whether that is allowed based on attendance settings.

## Server-Side Start Job Logic

The start mutation is:

- `src/server/api/routers/worker.ts` -> `startJob`

The server:

1. Confirms the logged-in worker is assigned to the job.
2. Loads the job, scheduled times, authorisation flags, and linked job-site coordinates.
3. Loads `tenant_settings.attendance_settings`.
4. Builds `workerLocation` from the browser coordinates sent by the worker app.
5. Builds `siteLocation` from `job_sites.latitude` and `job_sites.longitude`.
6. Calculates distance with `calculateDistanceMeters()`.
7. Runs `getStartGateFailure()`.
8. If there is no failure, records the actual start time and location evidence on the `jobs` row.

The distance calculation is in:

- `src/lib/payroll/attendance.ts`

It uses the Haversine formula and returns metres.

## Start Gate Rules

The default settings in `src/lib/payroll/attendance.ts` are currently:

```ts
start_distance_meters: 250
start_window_before_minutes: 30
start_window_after_minutes: 0
enforce_start_time_gate: true
enforce_location_distance_gate: true
enforce_location_accuracy_gate: true
require_location_to_start: true
max_location_accuracy_meters: 100
allow_admin_location_override: true
```

The admin UI can update the distance, GPS accuracy, location requirement, and location-related gate toggles at:

- `/dashboard/settings/attendance`
- `src/app/(admin)/dashboard/settings/attendance/page.tsx`

The settings API is:

- `src/server/api/routers/settings.ts` -> `updateAttendanceSettings`

The start-time rule itself is fixed in code: more than 30 minutes early is blocked, and there is no late-start cutoff.

The start gate can block a worker when:

- The job has no scheduled start time.
- The worker is more than 30 minutes before the scheduled start time.
- Location is required but the job site has no saved coordinates.
- Location is required but the worker browser/device did not provide coordinates.
- Location accuracy is worse than `max_location_accuracy_meters`.
- Distance from the saved job-site coordinates is greater than `start_distance_meters`.

If `location_override_authorized` is true on the job and admin location override is allowed in settings, the location checks are bypassed for that job.

There is no late-start cutoff. Once the job is inside the 30-minute early allowance, it can be started later that day or after the originally scheduled end time if it has not already been started or completed.

## What Gets Stored When A Job Starts

When start succeeds, the app updates the job with:

- `status = 'in_progress'`
- `actual_start_time`
- `payable_start_time`
- `payable_end_time`
- `payable_minutes`
- `start_latitude`
- `start_longitude`
- `start_location_accuracy_meters`
- `start_distance_meters`

This means the app keeps the factual worker GPS evidence separately from the scheduled job site coordinates.

## Complete Job Location Logic

The complete mutation is:

- `src/server/api/routers/worker.ts` -> `completeJob`

Completion is not time restricted. The only core rule is that the job must already have an `actual_start_time`.

Completion uses similar browser location input, but by default location is **not required** to complete a job:

```ts
require_location_to_complete: false
```

If an admin enables `require_location_to_complete`, completion will also enforce:

- saved job-site coordinates
- worker browser/device coordinates
- GPS accuracy limit
- distance from the job site

When complete succeeds, the app stores:

- `actual_end_time`
- `payable_start_time`
- `payable_end_time`
- `payable_minutes`
- `end_latitude`
- `end_longitude`
- `end_location_accuracy_meters`
- `end_distance_meters`

## How Address To Latitude/Longitude Works

There is a location router:

- `src/server/api/routers/location.ts`

It has three helper mutations:

- `getCoordinates`
- `getWhat3Words`
- `getFromWhat3Words`

### Address to coordinates

`getCoordinates` sends the typed address to OpenStreetMap Nominatim:

```text
https://nominatim.openstreetmap.org/search?format=json&q=<address>&limit=1
```

It returns:

- `latitude`
- `longitude`
- `displayName`

This is used in the existing edit job-site form:

- `src/app/(admin)/dashboard/job-sites/[id]/edit/edit-job-site-form.tsx`

The **Find Coordinates** button builds an address from:

- address
- city
- country

Then it calls `api.location.getCoordinates`, and if a result is found, fills the latitude and longitude fields in the form.

Important: this only fills the form. The coordinates become active for worker start/complete gates only after the admin saves the job site and the values are stored in `job_sites.latitude` and `job_sites.longitude`.

### New job-site page

The new job-site page currently exposes manual latitude, longitude, and What3Words fields:

- `src/app/(admin)/dashboard/job-sites/new/page.tsx`

At the time of writing, the new job-site page does not appear to have the same **Find Coordinates** button as the edit page. Coordinates can be entered manually there.

### What3Words

`getWhat3Words` converts saved coordinates to a three-word address using `WHAT3WORDS_API_KEY`.

`getFromWhat3Words` converts a three-word address back to coordinates.

These helper mutations exist, but the core start-job gate still uses the final saved `latitude` and `longitude` fields.

## Mapbox, Google Maps, And Navigation

The worker job detail page uses saved job-site coordinates to create an internal navigation link:

```text
/worker/navigation?destination=<latitude>,<longitude>
```

It also creates a Google Maps link using the address and city:

```text
https://maps.google.com/?q=<address, city>
```

The worker navigation page is:

- `src/app/(worker)/worker/navigation/page.tsx`

It uses Mapbox for map display and directions:

- `NEXT_PUBLIC_MAPBOX_TOKEN`
- Mapbox map rendering
- Mapbox Directions API

This map/navigation feature is separate from the start-job gate. The start-job gate does not call Mapbox or Google Maps when the worker presses **Start Job**.

Current note: the navigation page defines `userLocation`, but there is no visible handler currently setting it from the Mapbox `GeolocateControl`. That means route calculation may need a follow-up fix if live route display is still wanted. This does not affect the start-job gate.

## Seed And Test Data Coordinates

The workbook seed script is:

- `scripts/seed-workbook-data.js`

It creates real nearby addresses and coordinates for test job sites by using Mapbox reverse geocoding around:

- `BASE_LAT = 52.78509`
- `BASE_LNG = -1.615`

Those generated coordinates are inserted directly into `job_sites.latitude` and `job_sites.longitude`, so they are active for worker location gates.

## Practical Testing Notes

- Test start-job location gates on a phone whenever possible.
- Desktop browsers often provide poor or approximate location because they usually do not have GPS.
- If a worker is physically at the site but blocked, check:
  - job-site saved latitude/longitude
  - worker browser location permission
  - browser-reported accuracy
  - `start_distance_meters`
  - `max_location_accuracy_meters`
  - whether the job has a location override authorised
- If the site coordinates are wrong, editing the address alone will not fix the gate. The saved latitude and longitude must be corrected.

## Current Source Of Truth

For start/complete gating, the source of truth is:

```text
worker browser coordinates
vs
job_sites.latitude / job_sites.longitude
```

Postcode and address are useful for display, search, Google Maps links, and geocoding helpers, but they are not directly used by the worker start-job button once the button is pressed.
