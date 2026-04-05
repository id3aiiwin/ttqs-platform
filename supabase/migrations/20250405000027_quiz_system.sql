-- ============================================================
-- 027: 內建測驗系統（題庫 + 作答紀錄）
-- ============================================================

CREATE TABLE IF NOT EXISTS quizzes (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title           text NOT NULL,
  description     text,
  questions       jsonb NOT NULL DEFAULT '[]',
  time_limit      integer,
  pass_score      numeric DEFAULT 60,
  is_published    boolean DEFAULT false,
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "quizzes_modify" ON quizzes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  quiz_id         uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id),
  answers         jsonb NOT NULL DEFAULT '[]',
  score           numeric,
  total           numeric,
  percentage      numeric,
  passed          boolean DEFAULT false,
  completed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_attempts_select" ON quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));
CREATE POLICY "quiz_attempts_insert" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
