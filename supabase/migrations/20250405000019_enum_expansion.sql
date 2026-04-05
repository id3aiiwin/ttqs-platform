-- ============================================================
-- 019: 擴充 user_role enum（必須獨立 transaction）
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'instructor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';
