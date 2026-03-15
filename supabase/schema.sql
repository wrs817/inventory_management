-- ============================================================
-- Inventory Management — Supabase Schema
-- Run this in the Supabase SQL Editor (in order)
-- ============================================================

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          text NOT NULL DEFAULT '',
  reward_multiplier numeric NOT NULL DEFAULT 1,
  quantity          integer NOT NULL DEFAULT 0,
  original_price    numeric,
  member_price      numeric,
  barcode           text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Run this if the table already exists:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price numeric;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS member_price numeric;
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes text;
-- ALTER TABLE goods_in ADD COLUMN IF NOT EXISTS notes text;
-- ALTER TABLE goods_in ADD COLUMN IF NOT EXISTS can_collect_reward_points boolean NOT NULL DEFAULT true;
-- ALTER TABLE goods_in ADD COLUMN IF NOT EXISTS reward_points numeric NOT NULL DEFAULT 0;

CREATE TABLE sales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  customer    text NOT NULL,
  sell_price  numeric NOT NULL,
  quantity    integer NOT NULL CHECK (quantity > 0),
  sale_date   timestamptz NOT NULL DEFAULT now(),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goods_in (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id                uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  purchase_price            numeric NOT NULL,
  quantity                  integer NOT NULL CHECK (quantity > 0),
  can_collect_reward_points boolean NOT NULL DEFAULT true,
  reward_points             numeric NOT NULL DEFAULT 0,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TRIGGERS — auto-update product quantity
-- ============================================================

-- Deduct stock when a sale is inserted
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock
AFTER INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_sale();

-- Add stock when goods_in is inserted
CREATE OR REPLACE FUNCTION add_stock_on_goods_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_add_stock
AFTER INSERT ON goods_in
FOR EACH ROW EXECUTE FUNCTION add_stock_on_goods_in();

-- Calculate reward_points when goods_in is inserted
CREATE OR REPLACE FUNCTION calc_reward_points_on_goods_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_multiplier numeric;
BEGIN
  IF NEW.can_collect_reward_points THEN
    SELECT reward_multiplier INTO v_multiplier FROM products WHERE id = NEW.product_id;
    NEW.reward_points := COALESCE(v_multiplier, 0) * NEW.purchase_price * NEW.quantity;
  ELSE
    NEW.reward_points := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_reward_points
BEFORE INSERT ON goods_in
FOR EACH ROW EXECUTE FUNCTION calc_reward_points_on_goods_in();

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- products: list ordered by name, filter by category, search by name
CREATE INDEX idx_products_user_name     ON products (user_id, name);
CREATE INDEX idx_products_user_category ON products (user_id, category);
CREATE INDEX idx_products_name_trgm     ON products USING gin (name gin_trgm_ops);

-- sales: list ordered by sale_date, FK join
CREATE INDEX idx_sales_user_sale_date ON sales (user_id, sale_date DESC);
CREATE INDEX idx_sales_product_id     ON sales (product_id);

-- goods_in: list ordered by created_at, FK join
CREATE INDEX idx_goods_in_user_created_at ON goods_in (user_id, created_at DESC);
CREATE INDEX idx_goods_in_product_id      ON goods_in (product_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_in ENABLE ROW LEVEL SECURITY;

-- products
CREATE POLICY "users can view own products"   ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- sales
CREATE POLICY "users can view own sales"   ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);

-- goods_in
CREATE POLICY "users can view own goods_in"   ON goods_in FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own goods_in" ON goods_in FOR INSERT WITH CHECK (auth.uid() = user_id);
