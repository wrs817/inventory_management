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
  barcode           text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Run this if the table already exists:
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;

CREATE TABLE sales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  customer    text NOT NULL,
  sell_price  numeric NOT NULL,
  quantity    integer NOT NULL CHECK (quantity > 0),
  sale_date   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goods_in (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  purchase_price numeric NOT NULL,
  quantity       integer NOT NULL CHECK (quantity > 0),
  created_at     timestamptz NOT NULL DEFAULT now()
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

-- ============================================================
-- 3. ROW LEVEL SECURITY
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
