-- 講師上傳教材：教案、簡報、教學日誌
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  material_type text NOT NULL CHECK (material_type IN ('lesson_plan', 'presentation', 'teaching_log')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES profiles(id),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

-- 講師可以上傳/查看自己課程的教材
CREATE POLICY "Authenticated users can view course materials"
  ON course_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert course materials"
  ON course_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploader can delete own materials"
  ON course_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- 顧問可以管理所有教材
CREATE POLICY "Consultants can manage all materials"
  ON course_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant')
  );

CREATE INDEX idx_course_materials_course ON course_materials(course_id);
CREATE INDEX idx_course_materials_type ON course_materials(course_id, material_type);
