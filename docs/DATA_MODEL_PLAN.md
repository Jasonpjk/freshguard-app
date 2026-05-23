# FreshGuard — 백엔드 데이터 모델 계획

> 최종 업데이트: 2026-05-23

---

## 엔티티 관계 다이어그램 (ERD 요약)

```
Organization (1) ──────── (N) Store
Organization (1) ──────── (N) User
User (N) ──────────────── (M) Store  [StoreAssignment 테이블]
Store (1) ─────────────── (N) Item (StockItem)
Store (1) ─────────────── (N) StockLog
Store (1) ─────────────── (N) DisposalRecord
Store (1) ─────────────── (N) HygieneCheckSession
HygieneCheckSession (1) ── (N) HygieneCheckItem
Store (1) ─────────────── (N) StorageLocation
Organization (1) ──────── (1) Subscription
```

---

## 핵심 엔티티 상세

### 1. Organization (조직/사업체)
```sql
CREATE TABLE organizations (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        ENUM('individual','franchise_hq','management_company') DEFAULT 'individual',
  owner_id    VARCHAR(36) NOT NULL REFERENCES users(id),
  plan        ENUM('free','basic','pro','franchise') DEFAULT 'free',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Store (매장)
```sql
CREATE TABLE stores (
  id               VARCHAR(36) PRIMARY KEY,
  organization_id  VARCHAR(36) NOT NULL REFERENCES organizations(id),
  name             VARCHAR(100) NOT NULL,
  address          VARCHAR(255),
  type             ENUM('restaurant','cafe','bakery','catering','franchise','other'),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. User (사용자)
```sql
CREATE TABLE users (
  id              VARCHAR(36) PRIMARY KEY,
  email           VARCHAR(100) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(50) NOT NULL,
  role            ENUM('owner','manager','staff','hq_admin') DEFAULT 'staff',
  organization_id VARCHAR(36) REFERENCES organizations(id),
  is_active       BOOLEAN DEFAULT TRUE,
  last_active_at  DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. StoreAssignment (User ↔ Store 다대다)
```sql
CREATE TABLE store_assignments (
  user_id   VARCHAR(36) REFERENCES users(id),
  store_id  VARCHAR(36) REFERENCES stores(id),
  role      ENUM('owner','manager','staff') DEFAULT 'staff',
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, store_id)
);
```

### 5. Item / StockItem (품목 마스터 & 재고)

```sql
-- 품목 마스터 (반복 입고되는 품목 정보)
CREATE TABLE items (
  id                      VARCHAR(36) PRIMARY KEY,
  organization_id         VARCHAR(36) REFERENCES organizations(id),
  store_id                VARCHAR(36) REFERENCES stores(id),
  name                    VARCHAR(100) NOT NULL,
  category                VARCHAR(50),
  default_shelf_life_days INT,
  qr_label_enabled        BOOLEAN DEFAULT FALSE,
  created_by              VARCHAR(36) REFERENCES users(id),
  updated_by              VARCHAR(36) REFERENCES users(id),
  created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- 실제 입고된 재고 단위
CREATE TABLE stock_items (
  id                    VARCHAR(36) PRIMARY KEY,
  store_id              VARCHAR(36) NOT NULL REFERENCES stores(id),
  organization_id       VARCHAR(36) REFERENCES organizations(id),
  item_id               VARCHAR(36) REFERENCES items(id),
  location_id           VARCHAR(36) REFERENCES storage_locations(id),
  expiry_date           DATE NOT NULL,
  received_date         DATE NOT NULL,
  opened_date           DATE,
  quantity              DECIMAL(10,2) NOT NULL,
  unit                  VARCHAR(20),
  cost                  DECIMAL(10,2) DEFAULT 0,
  stock_status          ENUM('unopened','opened','used','disposed') DEFAULT 'unopened',
  opened_shelf_life_days INT,
  assignee_id           VARCHAR(36) REFERENCES users(id),
  memo                  TEXT,
  created_by            VARCHAR(36) REFERENCES users(id),
  updated_by            VARCHAR(36) REFERENCES users(id),
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. StockLog (재고 활동 로그)
```sql
CREATE TABLE stock_logs (
  id              VARCHAR(36) PRIMARY KEY,
  store_id        VARCHAR(36) NOT NULL REFERENCES stores(id),
  organization_id VARCHAR(36) REFERENCES organizations(id),
  stock_item_id   VARCHAR(36) REFERENCES stock_items(id),
  item_name       VARCHAR(100),
  log_type        ENUM('received','opened','used','disposed'),
  quantity        DECIMAL(10,2),
  unit            VARCHAR(20),
  handler_id      VARCHAR(36) REFERENCES users(id),
  memo            TEXT,
  logged_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 7. DisposalRecord (폐기 기록)
```sql
CREATE TABLE disposal_records (
  id              VARCHAR(36) PRIMARY KEY,
  store_id        VARCHAR(36) NOT NULL REFERENCES stores(id),
  organization_id VARCHAR(36) REFERENCES organizations(id),
  stock_item_id   VARCHAR(36) REFERENCES stock_items(id),
  item_name       VARCHAR(100),
  quantity        DECIMAL(10,2),
  unit            VARCHAR(20),
  reason          VARCHAR(200),
  loss            DECIMAL(10,2) DEFAULT 0,
  handler_id      VARCHAR(36) REFERENCES users(id),
  approver_id     VARCHAR(36) REFERENCES users(id),
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  disposed_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8. StorageLocation (보관 위치)
```sql
CREATE TABLE storage_locations (
  id              VARCHAR(36) PRIMARY KEY,
  store_id        VARCHAR(36) NOT NULL REFERENCES stores(id),
  organization_id VARCHAR(36) REFERENCES organizations(id),
  name            VARCHAR(100) NOT NULL,
  type            ENUM('refrigerator','freezer','dry','bar','other'),
  temperature     DECIMAL(5,1),
  capacity        INT,
  notes           TEXT
);
```

### 9. HygieneCheckTemplate (위생점검 항목 템플릿)
```sql
CREATE TABLE hygiene_check_templates (
  id          VARCHAR(36) PRIMARY KEY,
  store_id    VARCHAR(36) REFERENCES stores(id),  -- NULL = 글로벌 기본값
  category    VARCHAR(50),
  label       VARCHAR(200),
  required    BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0
);
```

### 10. HygieneCheckSession (위생점검 세션)
```sql
CREATE TABLE hygiene_check_sessions (
  id              VARCHAR(36) PRIMARY KEY,
  store_id        VARCHAR(36) NOT NULL REFERENCES stores(id),
  organization_id VARCHAR(36) REFERENCES organizations(id),
  checker_id      VARCHAR(36) REFERENCES users(id),
  checked_date    DATE NOT NULL,
  total_count     INT,
  done_count      INT,
  status          ENUM('incomplete','complete') DEFAULT 'incomplete',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 11. HygieneCheckItem (위생점검 항목 결과)
```sql
CREATE TABLE hygiene_check_items (
  id            VARCHAR(36) PRIMARY KEY,
  session_id    VARCHAR(36) NOT NULL REFERENCES hygiene_check_sessions(id),
  template_id   VARCHAR(36) REFERENCES hygiene_check_templates(id),
  checked       BOOLEAN DEFAULT FALSE,
  memo          TEXT,
  photo_url     VARCHAR(500)
);
```

### 12. Subscription (구독 정보)
```sql
CREATE TABLE subscriptions (
  id              VARCHAR(36) PRIMARY KEY,
  organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
  plan            ENUM('free','basic','pro','franchise') DEFAULT 'free',
  started_at      DATETIME,
  next_billing    DATE,
  payment_method  VARCHAR(50),
  status          ENUM('active','cancelled','expired') DEFAULT 'active'
);
```

---

## 프론트엔드 → 백엔드 데이터 매핑

| 프론트엔드 타입 | 백엔드 테이블 | localStorage 키 |
|---------------|-------------|-----------------|
| AuthUser | users | fg_auth (세션만) |
| Organization | organizations | fg_organizations |
| AppStore | stores | fg_auth (포함) |
| Item (AppContext) | stock_items (+ items 마스터) | fg_items |
| StockLog | stock_logs | fg_stock_logs |
| DisposalRecord | disposal_records | fg_disposal |
| StorageLocation | storage_locations | fg_locations |
| StaffMember | users + store_assignments | fg_staff |
| AppSettings | stores.settings (JSON) | fg_settings |

---

## 마이그레이션 전략

1. `fg_items` localStorage 배열 → `/api/migrate/items` 업로드
2. `item.storeId` 기본값 `"store_gangnnam"` → 실제 store.id로 교체
3. `item.organizationId` 기본값 `"org_demo"` → 실제 org.id로 교체
4. 기존 `fg_staff` → `/api/migrate/staff` 업로드
5. 기존 `fg_disposal` → `/api/migrate/disposal-records` 업로드
