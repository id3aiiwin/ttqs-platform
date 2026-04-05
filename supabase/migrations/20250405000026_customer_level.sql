-- ============================================================
-- 026: 客戶分級 + 標籤
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_tags text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spending numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
