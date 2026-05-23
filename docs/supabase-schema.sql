-- FreshGuard Supabase Schema
-- 실행 순서: 이 파일 전체를 Supabase SQL Editor에서 순서대로 실행하세요.
-- 의존성 순서: organizations → profiles → stores → store_members → items → ...

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. organizations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(30) NOT NULL DEFAULT 'individual'
                    CHECK (type IN ('individual', 'franchise_hq', 'management_company')),
  owner_id        UUID,                            -- references auth.users(id), set after profiles
  plan            VARCHAR(20) NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free', 'basic', 'pro', 'franchise')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. profiles (extends auth.users) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name            VARCHAR(50) NOT NULL DEFAULT '',
  role            VARCHAR(20) NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('owner', 'manager', 'staff', 'hq_admin')),
  phone           VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set owner_id after profiles exist
ALTER TABLE organizations
  ADD CONSTRAINT fk_org_owner FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── 3. stores ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  address         VARCHAR(255),
  type            VARCHAR(20) DEFAULT 'restaurant'
                    CHECK (type IN ('restaurant', 'cafe', 'bakery', 'catering', 'franchise', 'other')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. store_members (profiles ↔ stores N:M) ────────────────────────────────

CREATE TABLE IF NOT EXISTS store_members (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('owner', 'manager', 'staff')),
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, store_id)
);

-- ─── 5. storage_locations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS storage_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20) DEFAULT 'dry'
                    CHECK (type IN ('refrigerator', 'freezer', 'dry', 'bar', 'other')),
  temperature     DECIMAL(5,1),
  capacity        INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. items ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  location_id             UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  name                    VARCHAR(100) NOT NULL,
  category                VARCHAR(50),
  received_date           DATE NOT NULL,
  opened_date             DATE,
  expiry_date             DATE NOT NULL,
  opened_shelf_life_days  INT,                     -- 개봉 후 유효기간(일)
  use_after_open_days     INT,                     -- 기본 개봉 후 유효기간
  location                VARCHAR(100),            -- 위치명 텍스트 (location_id 보조)
  quantity                DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit                    VARCHAR(20) NOT NULL DEFAULT '',
  status                  VARCHAR(20) NOT NULL DEFAULT 'normal'
                            CHECK (status IN ('expired', 'urgent', 'warning', 'normal')),
  stock_status            VARCHAR(20) NOT NULL DEFAULT 'unopened'
                            CHECK (stock_status IN ('unopened', 'opened', 'used', 'disposed')),
  assignee                VARCHAR(50),
  qr_label_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  memo                    TEXT,
  cost                    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_store_id ON items(store_id);
CREATE INDEX idx_items_expiry_date ON items(expiry_date);
CREATE INDEX idx_items_stock_status ON items(stock_status);

-- ─── 7. stock_logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name       VARCHAR(100) NOT NULL DEFAULT '',  -- 삭제 후에도 이름 유지
  action          VARCHAR(20) NOT NULL
                    CHECK (action IN ('received', 'opened', 'used', 'disposed')),
  quantity        DECIMAL(10,2),
  unit            VARCHAR(20),
  note            TEXT,
  actor_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_logs_store_id ON stock_logs(store_id);
CREATE INDEX idx_stock_logs_created_at ON stock_logs(created_at);

-- ─── 8. disposal_records ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disposal_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id) ON DELETE SET NULL,
  item_name       VARCHAR(100) NOT NULL DEFAULT '',
  quantity        DECIMAL(10,2),
  unit            VARCHAR(20),
  reason          VARCHAR(200),
  loss_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  handler_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  handler_name    VARCHAR(50),
  approver_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approver_name   VARCHAR(50),
  approved_at     TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  photo_url       VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disposal_records_store_id ON disposal_records(store_id);
CREATE INDEX idx_disposal_records_created_at ON disposal_records(created_at);

-- ─── 9. hygiene_check_templates ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hygiene_check_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  store_id        UUID REFERENCES stores(id) ON DELETE CASCADE,  -- NULL = global default
  category        VARCHAR(50),
  label           VARCHAR(200) NOT NULL,
  required        BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── 10. hygiene_check_sessions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hygiene_check_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  checker_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  checked_date    DATE NOT NULL,
  total_count     INT NOT NULL DEFAULT 0,
  done_count      INT NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'incomplete'
                    CHECK (status IN ('incomplete', 'complete')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. hygiene_check_items ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hygiene_check_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES hygiene_check_sessions(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES hygiene_check_templates(id) ON DELETE SET NULL,
  label           VARCHAR(200),                    -- 삭제된 template에도 라벨 유지
  category        VARCHAR(50),
  checked         BOOLEAN NOT NULL DEFAULT FALSE,
  memo            TEXT,
  photo_url       VARCHAR(500),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 12. app_settings ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id                UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  warning_days            INT NOT NULL DEFAULT 3,
  urgent_days             INT NOT NULL DEFAULT 1,
  default_open_use_days   INT NOT NULL DEFAULT 3,
  notify_expired          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_urgent           BOOLEAN NOT NULL DEFAULT TRUE,
  notify_warning          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 13. subscriptions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan            VARCHAR(20) NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free', 'basic', 'pro', 'franchise')),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at      TIMESTAMPTZ,
  expires_at      DATE,
  next_billing    DATE,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 14. payment_methods ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_methods (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL DEFAULT 'card',  -- card, bank_transfer, etc.
  label           VARCHAR(100),                         -- 마지막 4자리 또는 은행명
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  pg_customer_id  VARCHAR(200),                         -- PG사 고객 ID (암호화 저장 권장)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at 자동 갱신 함수 ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'profiles', 'stores', 'storage_locations',
    'items', 'disposal_records', 'hygiene_check_sessions',
    'hygiene_check_items', 'app_settings', 'subscriptions'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();', t, t
    );
  END LOOP;
END $$;
