-- ============================================================
-- 016: 學員資料擴充（職稱、到職日、生日）
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday date;
