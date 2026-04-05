-- ============================================================
-- 017: LINE 官方帳號通知整合
-- ============================================================

-- profiles 加 LINE user ID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_user_id text;

-- 通知紀錄
CREATE TABLE IF NOT EXISTS line_notifications (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  course_id       uuid REFERENCES courses(id) ON DELETE CASCADE,
  sent_by         uuid REFERENCES profiles(id),
  message         text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  failed_count    integer NOT NULL DEFAULT 0,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE line_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "line_notifications_select" ON line_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "line_notifications_insert" ON line_notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant'));
