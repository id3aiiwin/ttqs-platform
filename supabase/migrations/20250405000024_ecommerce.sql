-- ============================================================
-- 024: 電商模組（產品、訂單、授權）
-- ============================================================

-- 1. 產品
CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title           text NOT NULL,
  description     text,
  type            text NOT NULL CHECK (type IN ('course', 'quiz', 'ebook')),
  price           numeric NOT NULL DEFAULT 0,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  cover_image     text,
  content_type    text,
  content_url     text,
  units           jsonb DEFAULT '[]',
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_modify" ON products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 2. 訂單
CREATE TABLE IF NOT EXISTS shop_orders (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  user_name       text,
  product_id      uuid NOT NULL REFERENCES products(id),
  product_name    text,
  amount          numeric NOT NULL DEFAULT 0,
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_note    text,
  payment_date    date,
  confirmed_by    uuid REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON shop_orders FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );
CREATE POLICY "orders_insert" ON shop_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update" ON shop_orders FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );

-- 3. 產品授權
CREATE TABLE IF NOT EXISTS user_licenses (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  product_id      uuid NOT NULL REFERENCES products(id),
  status          text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  purchased_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  UNIQUE(user_id, product_id)
);

ALTER TABLE user_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "licenses_select" ON user_licenses FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin'))
  );
CREATE POLICY "licenses_modify" ON user_licenses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));

-- 4. 測驗結果
CREATE TABLE IF NOT EXISTS quiz_results (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  product_id      uuid NOT NULL REFERENCES products(id),
  score           numeric,
  total           numeric,
  percentage      numeric,
  summary         text,
  result_data     jsonb,
  completed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_results_select" ON quiz_results FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('consultant', 'admin')));
CREATE POLICY "quiz_results_insert" ON quiz_results FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
