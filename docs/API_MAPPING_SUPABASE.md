# FreshGuard — 프론트 함수 ↔ Supabase 매핑

> ⚠️ **현재 FreshGuard의 기본 운영 방향은 Vercel + Railway + PostgreSQL입니다. 이 문서는 Supabase 모드 참고용으로 보존됩니다.**
> Railway API 매핑은 `API_MAPPING_RAILWAY.md`를 참조하세요.

> 최종 업데이트: 2026-05-24

---

## AuthContext 함수 매핑

| 프론트 함수 | Local 모드 | Supabase 모드 |
|------------|-----------|--------------|
| `login(email, password)` | `mockLogin()` (authService) | `supabase.auth.signInWithPassword()` |
| `signup(data)` | `mockSignup()` (authService) | `supabase.auth.signUp()` + RPC create_user_setup |
| `logout()` | `clearAuthSession()` (localStorage) | `supabase.auth.signOut()` |
| `requestPasswordReset(email)` | 항상 성공 반환 (mock) | `supabase.auth.resetPasswordForEmail()` |
| 세션 복원 | `loadAuthSession()` (localStorage) | `supabase.auth.getSession()` + `onAuthStateChange()` |
| profile 조회 | `resolveUserFromSession()` | `supabase.from("profiles").select("*").eq("id", userId)` |
| organization 조회 | DEMO_ORG 상수 | `supabase.from("organizations").select("*").eq("id", orgId)` |
| stores 조회 | DEMO_STORES 상수 | `supabase.from("stores").select("*").eq("organization_id", orgId)` |
| store_members 조회 | user.storeIds 배열 | `supabase.from("store_members").select("*").eq("user_id", userId)` |

---

## AppContext 함수 매핑

### 품목 CRUD

| 프론트 함수 | Supabase 테이블 | 쿼리 예시 |
|------------|----------------|----------|
| `addItem(item)` | `items` | `supabase.from("items").insert(mapToRow(item))` |
| `updateItem(id, updates)` | `items` | `supabase.from("items").update(mapToRow(updates)).eq("id", id)` |
| `deleteItem(id)` | `items` | `supabase.from("items").delete().eq("id", id)` |
| `getItemsByStockStatus(status)` | `items` | `supabase.from("items").select("*").eq("stock_status", status).eq("store_id", storeId)` |

### 입고 / 개봉 / 사용 완료 / 폐기

| 프론트 함수 | 연관 테이블 | 쿼리 동작 |
|------------|-----------|----------|
| `receiveItem(item)` | `items`, `stock_logs` | items INSERT + stock_logs INSERT (action="received") |
| `openItem(id, data)` | `items`, `stock_logs` | items UPDATE (stock_status="opened", opened_date, expiry_date 재계산) + stock_logs INSERT (action="opened") |
| `markItemUsed(id)` | `items`, `stock_logs` | items UPDATE (stock_status="used", quantity=0) + stock_logs INSERT (action="used") |
| `disposeItem(id, data)` | `items`, `stock_logs`, `disposal_records` | items UPDATE (stock_status="disposed") + stock_logs INSERT (action="disposed") + disposal_records INSERT |

### 폐기 기록

| 프론트 함수 | Supabase 테이블 | 비고 |
|------------|----------------|------|
| `addDisposalRecord(record)` | `disposal_records` | INSERT |
| `updateDisposalRecord(id, updates)` | `disposal_records` | UPDATE (approved_at, status, approver_id 등) |

### 보관 위치

| 프론트 함수 | Supabase 테이블 | 비고 |
|------------|----------------|------|
| `addLocation(loc)` | `storage_locations` | INSERT |
| `updateLocation(id, updates)` | `storage_locations` | UPDATE |
| `deleteLocation(id)` | `storage_locations` | DELETE |

### 직원 관리

| 프론트 함수 | Supabase 테이블 | 비고 |
|------------|----------------|------|
| `addStaff(member)` | `profiles`, `store_members` | 이메일 초대 → Edge Function (invite-staff) |
| `updateStaff(id, updates)` | `store_members`, `profiles` | role/status 변경 |
| `deleteStaff(id)` | `store_members` | DELETE (프로필 자체는 삭제 안 함) |

### 설정

| 프론트 함수 | Supabase 테이블 | 비고 |
|------------|----------------|------|
| `updateSettings(updates)` | `app_settings` | UPSERT (store_id 기준) |

---

## 위생점검 매핑

| 프론트 동작 | Supabase 테이블 | 쿼리 |
|------------|----------------|------|
| 템플릿 조회 | `hygiene_check_templates` | `select("*").or("store_id.eq.{storeId},store_id.is.null")` |
| 세션 시작 | `hygiene_check_sessions` | INSERT + 항목별 `hygiene_check_items` INSERT |
| 체크 항목 업데이트 | `hygiene_check_items` | UPDATE checked, memo, photo_url |
| 점검 이력 조회 | `hygiene_check_sessions` | `select("*, hygiene_check_items(*)")` |

---

## 리포트 데이터 집계

| 리포트 항목 | 집계 방법 |
|-----------|----------|
| 이번 달 폐기 합계 | `SELECT SUM(loss_amount) FROM disposal_records WHERE store_id=? AND created_at >= 월초` |
| 품목별 소비기한 현황 | `SELECT status, COUNT(*) FROM items WHERE store_id=? GROUP BY status` |
| 월별 폐기 추이 (Line 차트) | `SELECT DATE_TRUNC('month', created_at) AS month, SUM(loss_amount) FROM disposal_records GROUP BY month` |
| 카테고리별 폐기량 (Pie 차트) | `SELECT category, COUNT(*) FROM disposal_records JOIN items ON ... GROUP BY category` |
| 우선처리 품목 | `SELECT * FROM items WHERE store_id=? AND status != 'normal' ORDER BY expiry_date LIMIT 5` |

---

## 결제 / 구독

> 추후 Stripe 또는 국내 PG(토스페이먼츠, KG이니시스 등) 연동 예정.
> Supabase Edge Function을 통해 결제 이벤트를 수신하고 subscriptions 테이블을 업데이트하는 webhook 방식으로 구현.

| 프론트 화면 | 예정 연동 |
|-----------|---------|
| Subscription.tsx 요금제 변경 | Stripe Checkout Session 또는 토스페이먼츠 결제창 |
| 결제 수단 관리 | Stripe Customer Portal 또는 PG 관리 API |
| 구독 취소 | Stripe Cancel Subscription 또는 PG 연동 |

---

## 레포지토리 함수 시그니처 (실제 구현)

### authRepository
| 함수 | 반환 타입 | 설명 |
|------|-----------|------|
| `signIn(email, password)` | `SignInResult` | Supabase auth + loadWorkspace, needsOnboarding 플래그 포함 |
| `signUp(data)` | `SignUpResult` | 7단계 워크스페이스 생성 (org→store→profile→store_member→owner_id→app_settings) |
| `loadUserProfile(userId, email)` | `workspace \| null` | 세션 복원용, profiles+org+stores 조회 |
| `requestPasswordReset(email)` | `{ error }` | supabase.auth.resetPasswordForEmail |
| `updateOnboardingWorkspace(orgId, storeId, data)` | `boolean` | 온보딩 완료 후 org/store 이름 업데이트 |

### itemRepository / stockRepository / disposalRepository / storageLocationRepository
| 함수 | params 형태 | 비고 |
|------|------------|------|
| `fetchXxx({ organizationId, storeId })` | 객체 | 모든 fetch 함수는 object 형태 |
| `createXxx(data, { organizationId, storeId })` | 객체 | 두 번째 인자로 context 분리 |
| `updateXxx(id, updates)` | string id | Supabase UUID string |
| `deleteXxx(id)` | string id | Supabase UUID string |

---

## 프론트 타입 ↔ Supabase 컬럼 매핑 (items)

| 프론트 (camelCase) | Supabase (snake_case) |
|-------------------|----------------------|
| `id` | `id` (UUID) |
| `name` | `name` |
| `category` | `category` |
| `receivedDate` | `received_date` |
| `openedDate` | `opened_date` |
| `expiryDate` | `expiry_date` |
| `openedShelfLifeDays` | `opened_shelf_life_days` |
| `useAfterOpenDays` | `use_after_open_days` |
| `location` | `location` |
| `quantity` | `quantity` |
| `unit` | `unit` |
| `status` | `status` |
| `stockStatus` | `stock_status` |
| `assignee` | `assignee` |
| `qrLabelEnabled` | `qr_label_enabled` |
| `memo` | `memo` |
| `cost` | `cost` |
| `storeId` | `store_id` |
| `organizationId` | `organization_id` |
| `createdBy` | `created_by` |
| `updatedBy` | `updated_by` |
