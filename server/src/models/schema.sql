-- POS+ Full Database Schema
-- Run this to create all tables

-- Users (Admin / Staff)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',  -- 'admin' | 'staff'
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Menu Items)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name_th VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  description_th TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,  -- ต้นทุนต่อหน่วย (สำหรับ margin)
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tip_percent DECIMAL(5,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  vat_included BOOLEAN DEFAULT true,  -- VAT รวมอยู่ในราคาแล้ว
  vat_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name_th VARCHAR(200) NOT NULL,
  product_name_en VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- EXPENSES (ค่าใช้จ่าย — เน้นค่าวัตถุดิบ)
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  color VARCHAR(20) DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,  -- รูปใบเสร็จ
  note TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- STOCK (วัตถุดิบ / Stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(50) NOT NULL,           -- กก., ลิตร, ชิ้น ฯลฯ
  current_quantity DECIMAL(10,3) DEFAULT 0,
  min_quantity DECIMAL(10,3) DEFAULT 0, -- ขั้นต่ำให้แจ้งเตือน
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements (เข้า/ออก)
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  stock_item_id INTEGER REFERENCES stock_items(id) ON DELETE CASCADE,
  movement_type VARCHAR(10) NOT NULL,   -- 'in' | 'out'
  quantity DECIMAL(10,3) NOT NULL,
  note TEXT,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TAX RECORDS (ภาษีสรรพากร)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_records (
  id SERIAL PRIMARY KEY,
  period_type VARCHAR(10) NOT NULL,     -- 'monthly' | 'quarterly' | 'yearly'
  period_year INTEGER NOT NULL,
  period_month INTEGER,                 -- 1-12 หรือ NULL สำหรับ yearly
  period_quarter INTEGER,              -- 1-4 หรือ NULL
  gross_revenue DECIMAL(12,2) NOT NULL,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  net_income DECIMAL(12,2) NOT NULL,   -- รายได้สุทธิ
  vat_collected DECIMAL(12,2) DEFAULT 0,   -- VAT ที่เก็บจากลูกค้า 7%
  vat_input DECIMAL(12,2) DEFAULT 0,       -- VAT ที่จ่ายค่าใช้จ่าย (input tax)
  vat_payable DECIMAL(12,2) DEFAULT 0,     -- VAT ที่ต้องส่งสรรพากร (output - input)
  income_tax_estimate DECIMAL(12,2) DEFAULT 0, -- ประมาณภาษีเงินได้
  tax_status VARCHAR(20) DEFAULT 'draft',  -- 'draft' | 'filed' | 'paid'
  filed_at TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DAILY / MONTHLY SUMMARY CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_summary (
  id SERIAL PRIMARY KEY,
  summary_date DATE UNIQUE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  total_discount DECIMAL(12,2) DEFAULT 0,
  total_tips DECIMAL(12,2) DEFAULT 0,
  vat_collected DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  cogs DECIMAL(12,2) DEFAULT 0,        -- Cost of Goods Sold
  gross_profit DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MEMBERS (ระบบสะสมแต้ม — เตรียมไว้)
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  points INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(summary_date);

-- ============================================================
-- DEFAULT DATA
-- ============================================================
INSERT INTO expense_categories (name, name_en, color) VALUES
  ('ค่าวัตถุดิบ/ต้นทุน', 'Raw Materials / COGS', '#f97316')
ON CONFLICT DO NOTHING;
