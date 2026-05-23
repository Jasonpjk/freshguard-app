# FreshGuard — 백엔드 데이터 모델 계획

> 최종 업데이트: 2026-05-23
> 현재 상태: 프론트엔드 localStorage 기반 → 추후 REST API + DB 전환 예정

## 핵심 엔티티 (12개)

### 1. Store (매장)
```sql
CREATE TABLE stores (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(255),
  owner_name  VARCHAR(50),
  plan        ENUM('free','basic','pro','franchise') DEFAULT 'free',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. User (사용자/직원)
```sql
CREATE TABLE users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  name        VARCHAR(50) NOT NULL,
  email       VARCHAR(100) UNIQUE,
  phone       VARCHAR(20),
  role        ENUM('staff','manager','owner','admin') DEFAULT 'staff',
  status      ENUM('active','inactive') DEFAULT 'active',
  last_active DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Category (카테고리)
```sql
CREATE TABLE categories (
  id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id BIGINT REFERENCES stores(id),
  name     VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);
```

### 4. StorageLocation (보관 위치)
```sql
CREATE TABLE storage_locations (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  name        VARCHAR(100) NOT NULL,
  type        ENUM('refrigerator','freezer','dry','bar','other'),
  temperature DECIMAL(5,1),
  capacity    INT,
  notes       TEXT
);
```

### 5. Item (품목 마스터)
```sql
CREATE TABLE items (
  id                    BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id              BIGINT NOT NULL REFERENCES stores(id),
  name                  VARCHAR(100) NOT NULL,
  category_id           BIGINT REFERENCES categories(id),
  opened_shelf_life_days INT,       -- 개봉 후 기본 유효일
  qr_label_enabled      BOOLEAN DEFAULT FALSE,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6. StockItem (재고 단위)
```sql
CREATE TABLE stock_items (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id         BIGINT NOT NULL REFERENCES stores(id),
  item_id          BIGINT NOT NULL REFERENCES items(id),
  location_id      BIGINT REFERENCES storage_locations(id),
  expiry_date      DATE NOT NULL,
  received_date    DATE NOT NULL,
  opened_date      DATE,
  quantity         DECIMAL(10,2) NOT NULL,
  unit             VARCHAR(20),
  cost             DECIMAL(10,2) DEFAULT 0,
  stock_status     ENUM('unopened','opened','used','disposed') DEFAULT 'unopened',
  assignee_id      BIGINT REFERENCES users(id),
  memo             TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### 7. StockLog (재고 활동 로그)
```sql
CREATE TABLE stock_logs (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id     BIGINT NOT NULL REFERENCES stores(id),
  stock_item_id BIGINT REFERENCES stock_items(id),
  item_name    VARCHAR(100),
  log_type     ENUM('received','opened','used','disposed'),
  quantity     DECIMAL(10,2),
  unit         VARCHAR(20),
  handler_id   BIGINT REFERENCES users(id),
  memo         TEXT,
  logged_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8. DisposalRecord (폐기 기록)
```sql
CREATE TABLE disposal_records (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id       BIGINT NOT NULL REFERENCES stores(id),
  stock_item_id  BIGINT REFERENCES stock_items(id),
  item_name      VARCHAR(100),
  quantity       DECIMAL(10,2),
  unit           VARCHAR(20),
  reason         VARCHAR(200),
  loss           DECIMAL(10,2) DEFAULT 0,
  handler_id     BIGINT REFERENCES users(id),
  approver_id    BIGINT REFERENCES users(id),
  status         ENUM('pending','approved','rejected') DEFAULT 'pending',
  disposed_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 9. HygieneCheckTemplate (위생점검 템플릿)
```sql
CREATE TABLE hygiene_check_templates (
  id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id BIGINT REFERENCES stores(id),
  category VARCHAR(50),
  label    VARCHAR(200),
  required BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0
);
```

### 10. HygieneCheckSession (위생점검 세션)
```sql
CREATE TABLE hygiene_check_sessions (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id     BIGINT NOT NULL REFERENCES stores(id),
  checker_id   BIGINT REFERENCES users(id),
  checked_date DATE NOT NULL,
  total_count  INT,
  done_count   INT,
  status       ENUM('incomplete','complete') DEFAULT 'incomplete',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 11. HygieneCheckItem (위생점검 항목 결과)
```sql
CREATE TABLE hygiene_check_items (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id  BIGINT NOT NULL REFERENCES hygiene_check_sessions(id),
  template_id BIGINT REFERENCES hygiene_check_templates(id),
  checked     BOOLEAN DEFAULT FALSE,
  memo        TEXT,
  photo_url   VARCHAR(500)
);
```

### 12. Subscription (구독 정보)
```sql
CREATE TABLE subscriptions (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id    BIGINT NOT NULL REFERENCES stores(id),
  plan        ENUM('free','basic','pro','franchise') DEFAULT 'free',
  started_at  DATETIME,
  next_billing DATE,
  payment_method VARCHAR(50),
  status      ENUM('active','cancelled','expired') DEFAULT 'active'
);
```

## 관계 요약

```
Store (1) ─── (N) User
Store (1) ─── (N) Category
Store (1) ─── (N) StorageLocation
Store (1) ─── (N) Item ─── (N) StockItem
StockItem (1) ─── (N) StockLog
StockItem (1) ─── (1) DisposalRecord
Store (1) ─── (N) HygieneCheckTemplate
Store (1) ─── (N) HygieneCheckSession ─── (N) HygieneCheckItem
Store (1) ─── (1) Subscription
```

## 마이그레이션 전략

1. 현재 localStorage 데이터 → `/api/migrate` 엔드포인트로 일괄 업로드
2. `items` 배열의 각 Item → `items` 마스터 + `stock_items` 레코드로 분리
3. `fg_stock_logs` → `stock_logs` 테이블로 직접 매핑
4. `fg_disposal` → `disposal_records` 테이블로 직접 매핑
