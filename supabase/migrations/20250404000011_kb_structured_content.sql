-- ============================================================
-- 011: 知識庫結構化內容
-- 用 JSONB 存放結構化表單 schema，與 PDDRO 表單共用格式
-- ============================================================

ALTER TABLE knowledge_base_templates
  ADD COLUMN IF NOT EXISTS structured_content jsonb;
