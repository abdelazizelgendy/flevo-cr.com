-- FLEVO Articles Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS articles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title_ar      text NOT NULL,
  title_en      text,
  excerpt_ar    text,
  excerpt_en    text,
  content_ar    text,
  content_en    text,
  category_ar   text,
  category_en   text,
  image_url     text,
  published     boolean DEFAULT true,
  display_order integer DEFAULT 999,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON articles FOR SELECT
  USING (published = true);

CREATE POLICY "admin all"
  ON articles FOR ALL
  USING (auth.role() = 'authenticated');

-- Seed: existing articles from articles-data.js
INSERT INTO articles (slug, title_ar, title_en, excerpt_ar, excerpt_en, category_ar, category_en, image_url, published, display_order, created_at)
VALUES
  (
    'booth-design-principles',
    '7 مبادئ تجعل بوث المعرض أكثر جذبًا وتأثيرًا',
    '7 Principles That Make an Exhibition Booth More Engaging',
    'من وضوح الرسالة إلى حركة الزوار والإضاءة، تعرف على أهم المبادئ التي تحول البوث إلى تجربة متكاملة تخدم العلامة التجارية.',
    'From message clarity to visitor flow and lighting, discover the principles that turn a booth into a complete brand experience.',
    'تصميم البوثات',
    'Booth Design',
    'assets/images/project-09.jpeg',
    true,
    1,
    '2026-07-22T00:00:00Z'
  ),
  (
    'event-production-process',
    'كيف ننتقل من الفكرة إلى فعالية جاهزة للافتتاح؟',
    'How Do We Move From Concept to a Launch-Ready Event?',
    'رحلة مختصرة عبر مراحل التخطيط والتصميم والتصنيع والتركيب والاختبار التي تضمن تنفيذًا متقنًا في الموعد.',
    'A concise journey through planning, design, fabrication, installation and testing for a precise on-time delivery.',
    'تنفيذ الفعاليات',
    'Event Production',
    'assets/images/project-21.jpeg',
    true,
    2,
    '2026-07-20T00:00:00Z'
  ),
  (
    'custom-fabrication-quality',
    'أسس ضبط الجودة في أعمال التصنيع الإبداعي',
    'Quality Control Essentials in Creative Fabrication',
    'كيف نراجع الخامات والتفاصيل والتجميع والتشطيب قبل انتقال العناصر إلى موقع المشروع لضمان أفضل نتيجة ممكنة.',
    'How materials, detailing, assembly and finishing are reviewed before site delivery to ensure the best possible result.',
    'التصنيع الخاص',
    'Custom Fabrication',
    'assets/images/project-04.jpeg',
    true,
    3,
    '2026-07-18T00:00:00Z'
  )
ON CONFLICT (slug) DO NOTHING;
