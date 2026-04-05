-- ============================================================
-- 020: 多角色 + 講師模組 + 課程擴充
-- ============================================================

-- 1. profiles 加多角色陣列 + 講師欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instructor_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accumulated_hours numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS annual_hours numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS refresh_training_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS internship_reports_reviewed integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS articles_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS recommendations_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promotion_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promotion_target_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promotion_applied_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promotion_history jsonb DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analyst_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_personal_client boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_satisfaction numeric DEFAULT 0;

-- 2. 同步現有 role 到 roles 陣列
UPDATE profiles SET roles = ARRAY[role::text] WHERE roles = '{}' OR roles IS NULL;

-- 3. 講師額外時數
CREATE TABLE IF NOT EXISTS instructor_extra_hours (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hours numeric NOT NULL,
  reason text,
  date date,
  added_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE instructor_extra_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extra_hours_select" ON instructor_extra_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "extra_hours_modify" ON instructor_extra_hours FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 4. 課程擴充
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type text DEFAULT 'enterprise';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS material_submit_date date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS teaching_log_submit_date date;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS reject_reason text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_counted_in_hours boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS default_fee numeric;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_revenue numeric DEFAULT 0;
