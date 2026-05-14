# Job Attendance, Location Gate, and Payroll Rules

## Current Direction

Live turn-by-turn navigation is no longer a core requirement. The worker app may still offer map links or a simple map view, but the important workflow is attendance control:

- A worker can only start a job inside the configured distance from the job site.
- A worker can start up to 30 minutes before the scheduled start time and any time after that.
- A worker can complete a job only after it has been started; completion is not time restricted.
- Admin users manage distance and location accuracy settings. The start-time rule is fixed at 30 minutes early, with no late cutoff.
- Admin users review actual attendance against scheduled attendance for payroll.
- Actual worker timestamps must be preserved. Payroll adjustments create payable/effective times without overwriting actual times.

## Data Model

Existing `jobs.start_time` and `jobs.end_time` are the scheduled start and scheduled end.

The attendance/payroll extension adds:

- `actual_start_time` and `actual_end_time`: the timestamps captured when the worker starts and completes the job.
- `payable_start_time` and `payable_end_time`: the timestamps used for payroll after applying default rules and admin authorisations.
- `payable_minutes`: calculated payable duration.
- Start/end latitude, longitude, accuracy, and distance from the job site.
- Authorisation flags for early starts, late starts, late finishes, and location override.
- Payroll notes, adjusted-by user, and adjusted-at timestamp.
- `job_payroll_adjustments`: an audit table for admin changes.
- `tenant_settings.attendance_settings`: tenant-level admin configuration.

## Default Admin Settings

Recommended starting defaults:

- Start distance: `250` metres.
- Start window before scheduled time: `30` minutes.
- No start cutoff after the scheduled start time.
- No scheduled end-time completion gate.
- Location required to start: `true`.
- Location required to complete: `false`.
- Maximum acceptable GPS accuracy: `100` metres.
- Admin location override available: `true`.

These values are editable in System Settings > Attendance & Payroll.

## Worker Start Rules

When the worker taps Start Job:

1. The app asks the browser/device for the current location.
2. The server verifies the worker is assigned to the job.
3. The server blocks starts more than 30 minutes before the scheduled start time.
4. The server checks distance from the job site's stored latitude/longitude.
5. If allowed, the server records actual start time, location evidence, distance, and sets the job to `in_progress`.

If the job site has no coordinates and location is required, the worker is blocked until the site is fixed or an admin authorises a location override.

## Worker Finish Rules

When the worker taps Complete Job:

1. The app attempts to capture the current location.
2. The server verifies assignment and in-progress status.
3. The server records actual finish time and any available location evidence.
4. The server calculates payable start/end and payable minutes.
5. The job status becomes `completed`.

There is no scheduled-time gate for completion. The only time-related rule is that the job must already have an `actual_start_time`.

## Payroll Calculation Rules

Actual timestamps remain factual attendance records. Payable timestamps are calculated separately:

- Worker starts early: use scheduled start unless admin authorises early start.
- Worker starts late: use actual start unless admin authorises scheduled start.
- Worker finishes early: use scheduled end.
- Worker finishes late: use scheduled end unless admin authorises late finish.

The current implementation stores the authorisation flags on the job. Future payroll reporting should aggregate `payable_minutes`, grouped by worker and pay period.

## Admin Workflow

Initial admin functionality:

- Configure attendance gate settings.
- View scheduled, actual, and payable timestamps on the job detail schedule tab.
- Authorise early start, late start, and late finish payroll treatment.
- Add payroll adjustment notes.
- Persist an audit entry for each payroll adjustment.

Next payroll-reporting phase:

- Add a payroll review screen filtered by worker and date range.
- Show exceptions first: blocked starts, missing actual times, late starts, late finishes, and manual adjustments.
- Export payable minutes/hours for payroll processing.

## Known Constraints

- Browser geolocation depends on user permission and device support.
- Location checks use the coordinates stored on the job site. Poor site coordinates will block valid workers.
- Mapbox/TomTom/what3words keys are not required for the core start gate. The gate uses browser geolocation plus stored job-site coordinates.

## Applying The Migration

The schema change lives at `supabase/migrations/20260509000000_add_job_attendance_payroll.sql`.

If the local `.env` file contains a direct `DATABASE_URL`, it can be applied with the repo's Node/Postgres tooling. If it only contains Supabase API keys, open Supabase Dashboard > SQL Editor, paste the migration SQL, and run it once for the target project.
