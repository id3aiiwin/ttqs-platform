-- ============================================================
-- 022: 天賦評量系統
-- ============================================================

CREATE TABLE IF NOT EXISTS talent_assessments (
  id                  uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  drives              jsonb NOT NULL DEFAULT '[]',
  brain_regions       jsonb DEFAULT '{}',
  assessment_date     date,
  assessment_version  text,
  assessment_spending numeric DEFAULT 0,
  assessor_id         uuid REFERENCES profiles(id),
  assessor_name       text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE talent_assessments ENABLE ROW LEVEL SECURITY;

-- 學員看自己、分析師看自己的個案、顧問看全部
CREATE POLICY "talent_select" ON talent_assessments FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR assessor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );

CREATE POLICY "talent_modify" ON talent_assessments FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin', 'analyst'))
  );
