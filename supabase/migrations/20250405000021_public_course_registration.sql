-- ============================================================
-- 021: 公開課報名 + 匯款追蹤 + 課程模板
-- ============================================================

-- 1. 課程報名（含個別費用與匯款追蹤）
CREATE TABLE IF NOT EXISTS course_registrations (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  course_id       uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id      uuid REFERENCES profiles(id),
  student_name    text,
  student_email   text,
  student_phone   text,
  fee             numeric DEFAULT 0,
  payment_status  text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'confirmed')),
  payment_date    date,
  account_last5   text,
  payment_note    text,
  registered_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations_select" ON course_registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "registrations_modify" ON course_registrations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 2. 課程模板（公版課程主檔）
CREATE TABLE IF NOT EXISTS course_templates_v2 (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name            text NOT NULL,
  course_type     text DEFAULT 'public' CHECK (course_type IN ('public', 'enterprise')),
  hours           numeric,
  description     text,
  default_fee     numeric,
  outline         jsonb DEFAULT '[]',
  target_audience text,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_templates_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_templates_v2_select" ON course_templates_v2 FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_templates_v2_modify" ON course_templates_v2 FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 3. courses 補上 company_id 可為 null（公開課不綁企業）
ALTER TABLE courses ALTER COLUMN company_id DROP NOT NULL;
