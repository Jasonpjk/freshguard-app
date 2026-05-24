# FreshGuard — 프론트 Repository 함수 ↔ Railway FastAPI 엔드포인트 매핑

> 최종 업데이트: 2026-05-24
> VITE_BACKEND_MODE=api 일 때 프론트 repository 함수가 호출하는 FastAPI 엔드포인트 목록

---

## AuthContext / authRepository

| 프론트 함수 | HTTP | 엔드포인트 | 비고 |
|------------|------|-----------|------|
| `signUp(data)` | POST | `/api/v1/auth/signup` | JWT 발급 + org/store/profile 생성 |
| `signIn(email, pw)` | POST | `/api/v1/auth/login` | JWT 발급 |
| `signOut()` | POST | `/api/v1/auth/logout` | 클라이언트 토큰 삭제 |
| `loadUserProfile(userId, email)` | GET | `/api/v1/auth/me` | 현재 사용자 + org + stores |
| `requestPasswordReset(email)` | POST | `/api/v1/auth/password-reset` | 이메일 발송 (TODO) |
| `updateOnboardingWorkspace(...)` | POST | `/api/v1/auth/onboarding` | org/store 이름/타입 업데이트 |

---

## itemRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchItems({ storeId })` | GET | `/api/v1/items?storeId=...` |
| `createItem(item, { storeId, orgId })` | POST | `/api/v1/items` |
| `updateItem(id, updates)` | PATCH | `/api/v1/items/{id}` |
| `deleteItem(id)` | DELETE | `/api/v1/items/{id}` |
| `updateStockStatus(id, status, extra)` | PATCH | `/api/v1/items/{id}/stock-status` |

---

## stockRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchStockLogs({ storeId })` | GET | `/api/v1/stock-logs?storeId=...` |
| `createStockLog(log, { storeId, orgId })` | POST | `/api/v1/stock-logs` |

---

## disposalRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchDisposalRecords({ storeId })` | GET | `/api/v1/disposal-records?storeId=...` |
| `createDisposalRecord(record, { storeId })` | POST | `/api/v1/disposal-records` |
| `updateDisposalRecord(id, updates)` | PATCH | `/api/v1/disposal-records/{id}` |

---

## storageLocationRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchStorageLocations({ storeId })` | GET | `/api/v1/storage-locations?storeId=...` |
| `createStorageLocation(loc, { storeId })` | POST | `/api/v1/storage-locations` |
| `updateStorageLocation(id, updates)` | PATCH | `/api/v1/storage-locations/{id}` |
| `deleteStorageLocation(id)` | DELETE | `/api/v1/storage-locations/{id}` |

---

## hygieneRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchTemplates({ storeId })` | GET | `/api/v1/hygiene/templates?storeId=...` |
| `fetchSessions({ storeId })` | GET | `/api/v1/hygiene/sessions?storeId=...` |
| `createSession(session, { orgId })` | POST | `/api/v1/hygiene/sessions` |
| `fetchCheckItems(sessionId)` | GET | `/api/v1/hygiene/sessions/{id}/items` |
| `updateCheckItem(id, updates)` | PATCH | `/api/v1/hygiene/check-items/{id}` |

---

## staffRepository

| 프론트 함수 | HTTP | 엔드포인트 |
|------------|------|-----------|
| `fetchStaff({ storeId })` | GET | `/api/v1/staff?storeId=...` |
| `inviteStaff(email, storeId, role)` | POST | `/api/v1/staff/invite` |
| `updateStaffMember(userId, storeId, updates)` | PATCH | `/api/v1/staff/{userId}` |
| `removeStaffMember(userId, storeId)` | DELETE | `/api/v1/staff/{userId}?storeId=...` |

---

## Reports (직접 호출)

| 화면 | HTTP | 엔드포인트 |
|------|------|-----------|
| Dashboard 요약 | GET | `/api/v1/reports/summary?storeId=...` |
| 월별 폐기 추이 | GET | `/api/v1/reports/disposal-trends?storeId=...` |
| 카테고리 분포 | GET | `/api/v1/reports/category-distribution?storeId=...` |

---

## 응답 타입 원칙

- API 응답은 프론트와 동일한 **camelCase** 형태로 반환
- DB 모델 내부는 snake_case (SQLAlchemy 컬럼명)
- 프론트 `Item.id` 타입은 `number`이나 API 모드에서는 UUID string (`as unknown as number` 캐스팅 불필요, string 그대로 사용)

---

## 인증 방식

- 로그인 성공 시 `accessToken` 반환 → `localStorage.setItem("fg_api_token", token)`
- 이후 모든 요청 헤더에 `Authorization: Bearer {token}` 자동 첨부 (apiClient.ts)
- 401 응답 시 토큰 삭제 + 로그인 화면 유도
