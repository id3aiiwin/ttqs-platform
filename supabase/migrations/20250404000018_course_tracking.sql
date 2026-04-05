-- ============================================================
-- 018: 課程訓練狀況追蹤（課中即時記錄）
-- ============================================================

CREATE TABLE IF NOT EXISTS course_tracking (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  -- 出席統計
  expected_count integer,
  actual_count   integer,
  absent_list    jsonb DEFAULT '[]'::jsonb,  -- [{ name, reason }]
  -- 課中狀況
  schedule_status text DEFAULT 'on_time' CHECK (schedule_status IN ('on_time','delayed','ahead','cancelled')),
  equipment_ok   boolean DEFAULT true,
  equipment_note text,
  -- 學員狀況
  engagement_level text DEFAULT 'normal' CHECK (engagement_level IN ('high','normal','low')),
  engagement_note text,
  -- 異常
  has_incident    boolean DEFAULT false,
  incident_desc   text,
  incident_action text,
  -- 課程照片數
  photo_count     integer DEFAULT 0,
  -- 備註
  summary         text,
  -- 記錄者
  recorded_by     uuid REFERENCES profiles(id),
  recorded_by_name text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_tracking_select" ON course_tracking FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant'));
CREATE POLICY "course_tracking_modify" ON course_tracking FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant'));
