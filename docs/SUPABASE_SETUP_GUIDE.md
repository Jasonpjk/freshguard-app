# FreshGuard — Supabase 설정 가이드

> 최종 업데이트: 2026-05-23

---

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름: `freshguard` (또는 원하는 이름)
4. 비밀번호: 안전한 DB 비밀번호 설정 (기록해두세요)
5. Region: **Northeast Asia (Seoul)** 권장
6. **Create new project** 클릭 → 약 1~2분 대기

---

## 2. 환경변수 설정

1. Supabase 대시보드 → **Settings** → **API**
2. 아래 값을 복사

| 항목 | 위치 |
|------|------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

3. 프로젝트 루트에 `.env.local` 파일 생성 (절대 커밋 금지):

```env
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. SQL Schema 실행 순서

Supabase 대시보드 → **SQL Editor** → **New query**

### Step 1 — Schema 생성

`docs/supabase-schema.sql` 전체 내용을 붙여넣고 **Run** 클릭.

테이블이 아래 순서로 생성됩니다:
1. `organizations`
2. `profiles`
3. `stores`
4. `store_members`
5. `storage_locations`
6. `items`
7. `stock_logs`
8. `disposal_records`
9. `hygiene_check_templates`
10. `hygiene_check_sessions`
11. `hygiene_check_items`
12. `app_settings`
13. `subscriptions`
14. `payment_methods`

### Step 2 — RLS 정책 실행

`docs/supabase-rls-policies.sql` 전체 내용을 붙여넣고 **Run** 클릭.

---

## 4. 테스트 계정 생성

Supabase 대시보드 → **Authentication** → **Users** → **Invite user**

또는 SQL Editor에서 직접:

```sql
-- 테스트용 seed 계정 (프로덕션에서는 사용 금지)
-- Supabase Auth는 직접 비밀번호를 삽입할 수 없으므로
-- 대시보드 또는 Admin API를 통해 생성하세요.
```

권장 방법:
1. 대시보드에서 `demo@freshguard.app` 계정 초대
2. 이메일 링크로 비밀번호 설정
3. 아래 Seed SQL 실행 (profiles + organization + store 생성)

---

## 5. Organization / Store / Profile Seed 방법

아래 SQL을 **Schema 및 RLS 실행 후**에 실행하세요.
`<AUTH_USER_ID>` 를 실제 auth.users.id 로 교체하세요.

```sql
-- 1. organization 생성
INSERT INTO organizations (id, name, type, plan)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'FreshGuard 데모',
  'franchise_hq',
  'pro'
);

-- 2. 강남점 생성
INSERT INTO stores (id, organization_id, name, address, type)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '강남점',
  '서울시 강남구 테헤란로 123',
  'restaurant'
);

-- 3. 홍대점 생성
INSERT INTO stores (id, organization_id, name, address, type)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '홍대점',
  '서울시 마포구 와우산로 94',
  'cafe'
);

-- 4. 오너 프로필 생성 (<AUTH_USER_ID> 교체 필요)
INSERT INTO profiles (id, organization_id, name, role)
VALUES (
  '<AUTH_USER_ID>',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '김점주',
  'owner'
);

-- 5. organizations.owner_id 업데이트
UPDATE organizations
SET owner_id = '<AUTH_USER_ID>'
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- 6. 오너를 강남점 + 홍대점에 배정
INSERT INTO store_members (user_id, store_id, role) VALUES
  ('<AUTH_USER_ID>', 'bbbbbbbb-0000-0000-0000-000000000001', 'owner'),
  ('<AUTH_USER_ID>', 'bbbbbbbb-0000-0000-0000-000000000002', 'owner');

-- 7. 기본 보관 위치 seed (강남점)
INSERT INTO storage_locations (organization_id, store_id, name, type, temperature, capacity, notes)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '냉장고 1번', 'refrigerator', 4, 100, '채소/유제품 전용'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '냉장고 2번', 'refrigerator', 3, 80, '육류/수산물 전용'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '냉동고 A', 'freezer', -18, 200, '냉동식품 전용'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '건식 창고', 'dry', null, 500, '상온 보관'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', '바 냉장고', 'bar', 5, 60, '음료/주류 전용');
```

---

## 6. Local 모드와 Supabase 모드 전환 방법

### Local 모드로 전환

`.env.local` 파일에서:

```env
VITE_BACKEND_MODE=local
```

또는 `.env.local` 파일 자체를 삭제하면 기본값 `local`로 동작합니다.

서버를 재시작하세요: `npm run dev`

### Supabase 모드로 전환

`.env.local` 파일에서:

```env
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

서버를 재시작하세요: `npm run dev`

---

## 7. 문제 발생 시 Local 모드로 복구

1. `.env.local` 에서 `VITE_BACKEND_MODE=local` 로 변경
2. `npm run dev` 재시작
3. 브라우저에서 새로고침
4. 기존 localStorage 데이터 그대로 사용 가능

---

## 8. 배포 시 환경변수 설정 (Vercel)

Vercel 대시보드 → **Project Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_BACKEND_MODE` | `supabase` |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

---

## 9. 현재 구현 상태 (2026-05-24 기준)

| 단계 | 상태 | 설명 |
|------|------|------|
| Supabase 패키지 설치 | ✅ 완료 | `@supabase/supabase-js` |
| supabaseClient.ts | ✅ 완료 | isSupabaseEnabled() 헬퍼 포함 |
| mappers.ts | ✅ 완료 | 16개 camelCase↔snake_case 변환 함수 |
| authRepository.ts | ✅ 완료 | signIn/signUp/loadUserProfile/온보딩 7단계 워크스페이스 생성 |
| itemRepository.ts | ✅ 완료 | CRUD 실제 Supabase 연동 |
| stockRepository.ts | ✅ 완료 | 조회/생성 (audit trail) |
| disposalRepository.ts | ✅ 완료 | CRUD 실제 Supabase 연동 |
| storageLocationRepository.ts | ✅ 완료 | CRUD 실제 Supabase 연동 |
| hygieneRepository.ts | ✅ 완료 | 템플릿/세션/체크아이템 CRUD |
| staffRepository.ts | ✅ 완료 | 조회/수정/삭제 (초대는 Edge Function 필요) |
| AuthContext Supabase 연동 | ✅ 완료 | 세션 복원, needsOnboarding 처리 |
| AppContext loadInitialData | ✅ 완료 | currentStore 변경 시 자동 데이터 로딩 |
| SQL Schema | ✅ 완료 | 14개 테이블 |
| RLS Policies | ✅ 완료 | 초안 (30+ 정책) |
| 시드 데이터 | ✅ 완료 | docs/supabase-seed.sql |
| 스태프 이메일 초대 | ⏳ 미완 | Edge Function invite-staff 구현 필요 |
| 워크스페이스 단일 트랜잭션 | ⏳ 미완 | RPC create_initial_workspace() 권장 |
| 결제/구독 | ⏳ 미완 | Stripe/PG 연동 예정 |

---

## 10. 로컬 개발 검증 절차

```bash
# 1. 로컬 모드 확인 (기존 기능 동작 확인)
VITE_BACKEND_MODE=local npm run dev

# 2. 빌드 성공 확인 (Supabase 미연결 상태에서도 성공해야 함)
npm run build

# 3. Supabase 모드 전환 후 로그인 테스트
# .env.local에 실제 Supabase URL/KEY 입력 후:
VITE_BACKEND_MODE=supabase npm run dev
```
