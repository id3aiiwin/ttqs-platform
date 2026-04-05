-- ============================================================
-- 013: 會議記錄簽核
-- 擴展 document_approvals 為通用簽核（可關聯文件或會議）
-- ============================================================

-- 加 meeting_id 讓 approval 可以關聯會議
ALTER TABLE document_approvals ADD COLUMN IF NOT EXISTS meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE;

-- 讓 document_id 可為 null（會議簽核不綁文件）
ALTER TABLE document_approvals ALTER COLUMN document_id DROP NOT NULL;

-- 會議也加 approval_id
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS approval_id uuid REFERENCES document_approvals(id);
