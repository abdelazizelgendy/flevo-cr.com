-- Run once in Supabase SQL Editor for FLEVO v4.6
alter table public.quotation_requests add column if not exists internal_notes text;

-- Allow authenticated admins to delete requests
drop policy if exists "Authenticated delete quotation requests" on public.quotation_requests;
create policy "Authenticated delete quotation requests"
on public.quotation_requests for delete to authenticated using (true);
