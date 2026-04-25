-- 為 departments 表加入 parent_id，支援 部門 → 科別 兩層架構
-- parent_id = null  → 頂層部門
-- parent_id = <id>  → 科別（屬於該部門）

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
