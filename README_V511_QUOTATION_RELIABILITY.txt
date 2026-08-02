FLEVO v5.11 — Quotation Reliability & Realtime

What changed
- The public quotation form now waits for Supabase to return the saved row before showing success.
- Clear 20-second timeout and connection errors.
- Client-side validation and anti-bot honeypot.
- Duplicate prevention using client_request_id when the migration is installed.
- Backward-compatible fallback if the migration has not been run yet.
- Admin quotations page receives INSERT/UPDATE/DELETE changes through Supabase Realtime.
- 15-second polling fallback if Realtime is unavailable or not enabled.
- Refresh on tab focus and when internet connection is restored.
- Live connection status, last update time and new-request notifications.
- Search is debounced and admin actions show non-blocking status messages.

Required one-time Supabase step
Run FLEVO_Quotation_Performance_Realtime_Migration_v511.sql in:
Supabase Dashboard > SQL Editor > New query > Paste > Run

The website still works before running the migration, but the migration enables:
1. Realtime updates.
2. Duplicate-safe submissions.
3. Faster query indexes.
4. Explicit RLS policies for public insert and authenticated administration.

Deployment
Upload the complete ZIP to Netlify Deploys. Do not upload individual files only.
