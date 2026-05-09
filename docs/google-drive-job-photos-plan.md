# Google Drive Job Photos Plan

## Goal

Workers need to capture job evidence from the worker app:

- Add job notes while on site.
- Upload before, during, and after photos.
- Store final photo files in the client's Google Drive / Google Workspace location.
- Delete temporary Supabase Storage copies only after Google Drive confirms the upload.

## Current State

- Worker start/complete is implemented with scheduled-time and location gates.
- Admin notes and generic attachments exist.
- Worker job notes currently show the job description only.
- Generic attachments upload to Supabase Storage and stay there.
- The original docs planned before/after photos, but no dedicated job-photo model exists yet.

## Storage Strategy

Supabase Storage becomes a temporary staging area. Google Drive is the system of record for worker job photos.

1. Worker selects/captures a photo on mobile.
2. Browser uploads the photo to Supabase Storage bucket `job-photos`.
3. App records a `job_photos` row with status `stored_in_supabase`.
4. Server downloads the staged object and uploads it to Google Drive.
5. Server stores the Google Drive file ID/link in `job_photos`.
6. Server deletes the Supabase Storage object.
7. `job_photos` status becomes `stored_in_google_drive`.

If Google Drive upload fails, the Supabase copy is kept and the row status becomes `google_drive_failed`. This avoids losing evidence photos and allows retry.

## Google Account For Testing

Yes, a personal Google account can be used for testing.

Testing can use OAuth credentials:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`

The folder ID should be the Google Drive folder where test job photos should appear.

For the client's Workspace production setup, use a Workspace-admin-approved integration. The preferred long-term model is a service account with domain-wide delegation or an approved OAuth app scoped to a shared drive/folder.

## Worker UX

When a job is in progress, the worker sees a Job Evidence section:

- Add note.
- Upload before photo.
- Upload during photo.
- Upload after photo.
- See upload status for each photo.

The camera input should use mobile-friendly image capture and accept images only.

## Admin UX

Admin job detail gains a Photos tab:

- Group photos by before, during, after.
- Show upload status.
- Link to Google Drive once synced.
- Show staged/failed status if Drive sync needs attention.

## Data Model

`job_photos` stores:

- tenant/job/worker/user references
- `photo_type`: `before`, `during`, `after`
- optional description
- Supabase staging path
- Google Drive file ID/link/folder ID
- upload status
- captured/uploaded/synced timestamps
- last error

## Safety Rules

- Never delete the Supabase object until the Google Drive upload has returned a file ID.
- Keep failed uploads in Supabase for retry.
- Avoid exposing service-role credentials or Google refresh tokens to the browser.
- Worker can only upload photos for assigned jobs.
