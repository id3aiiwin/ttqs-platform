-- ============================================================
-- 010: 電子簽名
-- 企業成員可上傳簽名圖檔，簽核時使用圖檔
-- ============================================================

-- 簽名圖檔存在 profiles 表
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signature_url text;

-- 企業層級的預設簽核人設定
CREATE TABLE IF NOT EXISTS company_signers (
  id            uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signer_role   text NOT NULL,  -- e.g. '承辦人', '主管', '總經理'
  profile_id    uuid REFERENCES profiles(id),
  signer_name   text,
  signature_url text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, signer_role)
);

ALTER TABLE company_signers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_signers_select" ON company_signers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "company_signers_modify" ON company_signers
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant')
  );
