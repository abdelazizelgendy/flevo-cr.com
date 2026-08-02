-- FLEVO Storage policies for bucket flevo-media

-- Public can read files in the public bucket
drop policy if exists "Public read flevo media" on storage.objects;
create policy "Public read flevo media" on storage.objects for select to public using (bucket_id = 'flevo-media');

-- Authenticated administrators can upload
drop policy if exists "Authenticated upload flevo media" on storage.objects;
create policy "Authenticated upload flevo media" on storage.objects for insert to authenticated with check (bucket_id = 'flevo-media');

-- Authenticated administrators can update
drop policy if exists "Authenticated update flevo media" on storage.objects;
create policy "Authenticated update flevo media" on storage.objects for update to authenticated using (bucket_id = 'flevo-media') with check (bucket_id = 'flevo-media');

-- Authenticated administrators can delete
drop policy if exists "Authenticated delete flevo media" on storage.objects;
create policy "Authenticated delete flevo media" on storage.objects for delete to authenticated using (bucket_id = 'flevo-media');
