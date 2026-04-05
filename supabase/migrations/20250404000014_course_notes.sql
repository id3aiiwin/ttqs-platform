-- ============================================================
-- 014: 課程執行紀錄（顧問/講師內部紀錄）
-- ============================================================

CREATE TABLE IF NOT EXISTS course_notes (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles(id),
  author_name text,
  note_type   text NOT NULL DEFAULT 'observation' CHECK (note_type IN ('observation','teaching','issue','suggestion','other')),
  content     text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;

-- 只有顧問可看（is_internal = true 的紀錄）
CREATE POLICY "course_notes_select" ON course_notes FOR SELECT TO authenticated
  USING (
    is_internal = false
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant')
  );

CREATE POLICY "course_notes_modify" ON course_notes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant'));
