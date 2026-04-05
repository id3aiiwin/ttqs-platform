-- ============================================================
-- 008: 知識庫模板加入文件內容 + 指定企業欄位強化
-- ============================================================

-- 1. 加入 content 欄位存放文件文字內容（富文字 HTML）
ALTER TABLE knowledge_base_templates
  ADD COLUMN IF NOT EXISTS content text;

-- 2. 確保 allowed_companies 是 text array（已存在則跳過）
-- allowed_companies 已在建表時定義，無需再加
