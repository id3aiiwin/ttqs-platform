-- ============================================================
-- 025: 階段六 — 互動紀錄��待辦升級、行政檢核、通知、年度設定
-- ============================================================

-- 1. 互動紀錄 CRM
CREATE TABLE IF NOT EXISTS interactions (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  contact_date    date NOT NULL DEFAULT CURRENT_DATE,
  subject         text NOT NULL,
  contact_type    text DEFAULT 'phone' CHECK (contact_type IN ('phone','email','line','meeting','visit')),
  contact_person  text,
  handler         text,
  content         text,
  target_type     text CHECK (target_type IN ('company','person')),
  target_id       uuid,
  target_name     text,
  next_action     text,
  next_action_date date,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions_select" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "interactions_modify" ON interactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 2. 待辦系統
CREATE TABLE IF NOT EXISTS todos (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title           text NOT NULL,
  description     text,
  due_date        date,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  priority        text DEFAULT 'normal' CHECK (priority IN ('high','normal','low')),
  type            text DEFAULT 'manual' CHECK (type IN ('manual','followup','course_prep')),
  related_type    text,
  related_id      uuid,
  related_name    text,
  source          text,
  source_id       uuid,
  assigned_to     uuid REFERENCES profiles(id),
  completed_at    timestamptz,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_select" ON todos FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );
CREATE POLICY "todos_modify" ON todos FOR ALL TO authenticated USING (true);

-- 3. 行政檢核清單
CREATE TABLE IF NOT EXISTS admin_checklists (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  course_id       uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  items           jsonb DEFAULT '["講義","簽到表","教案","課後問卷"]',
  checked         jsonb DEFAULT '{}',
  updated_by      uuid REFERENCES profiles(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_select" ON admin_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklists_modify" ON admin_checklists FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 4. 通知系統
CREATE TABLE IF NOT EXISTS notifications (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message         text NOT NULL,
  icon            text DEFAULT '📢',
  link            text,
  is_read         boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 5. 企業年度設定
ALTER TABLE companies ADD COLUMN IF NOT EXISTS annual_settings jsonb DEFAULT '{}';
