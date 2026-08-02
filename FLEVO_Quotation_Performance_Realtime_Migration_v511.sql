-- FLEVO v5.11 — quotation reliability and realtime migration
-- Run once in Supabase Dashboard > SQL Editor.

begin;

-- Idempotency: prevents duplicate quotation rows when a network request is retried.
alter table public.quotation_requests
  add column if not exists client_request_id uuid;

create unique index if not exists quotation_requests_client_request_id_uidx
  on public.quotation_requests (client_request_id)
  where client_request_id is not null;

-- Faster administration dashboard ordering/filtering.
create index if not exists quotation_requests_created_at_idx
  on public.quotation_requests (created_at desc);
create index if not exists quotation_requests_status_idx
  on public.quotation_requests (status);

-- Ensure authenticated admins can read/update/delete.
alter table public.quotation_requests enable row level security;

drop policy if exists "Authenticated read quotation requests" on public.quotation_requests;
create policy "Authenticated read quotation requests"
on public.quotation_requests for select
to authenticated
using (true);

drop policy if exists "Authenticated update quotation requests" on public.quotation_requests;
create policy "Authenticated update quotation requests"
on public.quotation_requests for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated delete quotation requests" on public.quotation_requests;
create policy "Authenticated delete quotation requests"
on public.quotation_requests for delete
to authenticated
using (true);

-- Public visitors may create quotation requests, but cannot read them.
drop policy if exists "Public create quotation requests" on public.quotation_requests;
create policy "Public create quotation requests"
on public.quotation_requests for insert
to anon, authenticated
with check (
  customer_name is not null
  and length(btrim(customer_name)) between 2 and 120
  and phone is not null
  and length(regexp_replace(phone, '\D', '', 'g')) >= 8
  and coalesce(status, 'new') = 'new'
);

-- Add the table to Supabase Realtime publication, without failing if already added.
do $$
begin
  alter publication supabase_realtime add table public.quotation_requests;
exception
  when duplicate_object then null;
end $$;

commit;
