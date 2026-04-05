-- ============================================================
-- 015: 課程紀錄加入學員個別紀錄
-- employee_id 為 null = 整班紀錄，有值 = 針對單一學員
-- ============================================================

ALTER TABLE course_notes ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES profiles(id);
ALTER TABLE course_notes ADD COLUMN IF NOT EXISTS employee_name text;

-- 更新 RLS：學員個別紀錄只有顧問可見（企業和學員本人都看不到）
DROP POLICY IF EXISTS "course_notes_select" ON course_notes;
CREATE POLICY "course_notes_select" ON course_notes FOR SELECT TO authenticated
  USING (
    CASE
      WHEN employee_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant')
      WHEN is_internal = true THEN
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant')
      ELSE true
    END
  );
