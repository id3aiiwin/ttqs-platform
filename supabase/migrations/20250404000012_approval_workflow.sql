-- ============================================================
-- 012: 電子簽核流程
-- ============================================================

-- 1. 簽核流程定義（每家企業可自訂）
CREATE TABLE IF NOT EXISTS approval_flows (
  id          uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  steps       jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_flows_select" ON approval_flows FOR SELECT TO authenticated USING (true);
CREATE POLICY "approval_flows_modify" ON approval_flows FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant'));

-- 2. 文件簽核實例
CREATE TABLE IF NOT EXISTS document_approvals (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_id   uuid NOT NULL REFERENCES company_documents(id) ON DELETE CASCADE,
  flow_id       uuid REFERENCES approval_flows(id),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected')),
  current_step  integer NOT NULL DEFAULT 1,
  initiated_by  uuid REFERENCES profiles(id),
  initiated_at  timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_approvals_select" ON document_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_approvals_modify" ON document_approvals FOR ALL TO authenticated USING (true);

-- 3. 每一步的簽名紀錄
CREATE TABLE IF NOT EXISTS document_approval_signatures (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  approval_id     uuid NOT NULL REFERENCES document_approvals(id) ON DELETE CASCADE,
  step_order      integer NOT NULL,
  signer_role     text NOT NULL,
  signer_id       uuid REFERENCES profiles(id),
  signer_name     text,
  signature_url   text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','rejected')),
  comment         text,
  signed_at       timestamptz
);

ALTER TABLE document_approval_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_signatures_select" ON document_approval_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "approval_signatures_modify" ON document_approval_signatures FOR ALL TO authenticated USING (true);

-- 4. 擴充 company_documents
ALTER TABLE company_documents ADD COLUMN IF NOT EXISTS approval_id uuid REFERENCES document_approvals(id);
