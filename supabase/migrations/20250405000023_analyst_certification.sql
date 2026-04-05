-- ============================================================
-- 023: 分析師認證系統（9 級 + 個案管理）
-- ============================================================

-- 1. 分析師認證紀錄
CREATE TABLE IF NOT EXISTS analyst_certifications (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  analyst_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level           text NOT NULL,
  stage           integer NOT NULL DEFAULT 1,
  requirements_met jsonb DEFAULT '{}',
  certified_at    timestamptz,
  certified_by    uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analyst_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyst_cert_select" ON analyst_certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "analyst_cert_modify" ON analyst_certifications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant')));

-- 2. 分析師個案管理
CREATE TABLE IF NOT EXISTS analyst_cases (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  analyst_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES profiles(id),
  client_name     text,
  case_title      text NOT NULL,
  case_date       date,
  case_type       text DEFAULT 'standard',
  status          text DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  notes           text,
  file_url        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analyst_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyst_cases_select" ON analyst_cases FOR SELECT TO authenticated
  USING (
    analyst_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );
CREATE POLICY "analyst_cases_modify" ON analyst_cases FOR ALL TO authenticated
  USING (
    analyst_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant'))
  );
