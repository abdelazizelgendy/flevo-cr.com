-- FLEVO v5.0 - Hero background setting
alter table public.company_settings
add column if not exists hero_background_url text;
