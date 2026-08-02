alter table public.company_settings
  add column if not exists hero_title_ar text default 'نصمم ونصنع وننفّذ بإتقان',
  add column if not exists hero_title_en text default 'We Design, Build and Deliver with Precision',
  add column if not exists hero_description_ar text default 'تصميم وتصنيع وتنفيذ البوثات والمعارض والفعاليات بأعلى معايير الجودة والإبداع.',
  add column if not exists hero_description_en text default 'Design, fabrication and delivery of exhibition booths, events and brand experiences.',
  add column if not exists years_experience integer default 12,
  add column if not exists projects_count integer default 350,
  add column if not exists clients_count integer default 200,
  add column if not exists cities_count integer default 25;
