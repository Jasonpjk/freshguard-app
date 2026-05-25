# FreshGuard — 기능 구현 현황

> 최종 업데이트: 2026-05-24 (Railway api 모드 추가)

---

## 완료된 화면 (11개 + 인증 4개)

| 화면 | 컴포넌트 | 상태 | 설명 |
|------|----------|------|------|
| 대시보드 | Dashboard.tsx | ✅ 완료 | 소비기한 현황 6카드 + 입고/개봉 현황 4카드 + 우선처리 테이블 + storeId 필터 |
| 품목 관리 | ItemsManagement.tsx | ✅ 완료 | CRUD, 검색/필터, 소비기한 상태 배지 |
| 소비기한 캘린더 | ExpiryCalendar.tsx | ✅ 완료 | 월간 캘린더, 날짜별 품목 표시 |
| 입고/개봉 관리 | StockManagement.tsx | ✅ 완료 | 재고흐름, 입고 등록 10필드 모달, 개봉 처리 모달 |
| 폐기 기록 | DisposalRecords.tsx | ✅ 완료 | 폐기 목록, 승인/대기 상태, 월별 손실 합계 |
| 보관 위치 관리 | StorageLocations.tsx | ✅ 완료 | 위치 카드, 품목 통계, CRUD 모달 |
| 위생점검 | HygieneCheck.tsx | ✅ 완료 | 체크리스트, 카테고리 필터, 점검 이력 |
| 직원 관리 | StaffManagement.tsx | ✅ 완료 | 직원 목록, 역할/상태 필터, 초대/편집/삭제 |
| 리포트 | Reports.tsx | ✅ 완료 | recharts 차트 (Line, Bar, Pie) |
| 구독/결제 | Subscription.tsx | ✅ 완료 | 요금제 4단계, 결제 수단 표시 |
| 설정 | AppSettings.tsx | ✅ 완료 | 매장정보, 알림, 기준일수, 카테고리, 데이터 초기화 |
| 모바일 뷰 | MobileView.tsx | ✅ 완료 | 5탭 + 빠른 실행 버튼 5개 |

### 인증 화면 (신규)

| 화면 | 파일 | 상태 |
|------|------|------|
| 로그인 | pages/LoginPage.tsx | ✅ 완료 |
| 회원가입 | pages/SignupPage.tsx | ✅ 완료 |
| 비밀번호 재설정 | pages/ForgotPasswordPage.tsx | ✅ 완료 |
| 시작 설정 (온보딩) | pages/OnboardingPage.tsx | ✅ 완료 |

---

## 인증 시스템 (Mock Auth)

| 항목 | 상태 | 설명 |
|------|------|------|
| AuthContext | ✅ 완료 | localStorage 기반 mock auth |
| 로그인 유지 | ✅ 완료 | 새로고침 후에도 세션 복원 |
| 데모 계정 | ✅ 완료 | demo / manager / staff 3개 계정 |
| 커스텀 회원가입 | ✅ 완료 | localStorage에 신규 유저 저장 |
| 온보딩 완료 상태 | ✅ 완료 | 계정별 완료 여부 저장 |
| 비밀번호 재설정 (mock) | ✅ 완료 | 발송 완료 UI만 (실제 메일 없음) |

**데모 계정:**
- `demo@freshguard.app` / `demo1234` → **owner** (점주) - 전체 권한
- `manager@freshguard.app` / `demo1234` → **manager** (매니저) - 구독/결제 제외
- `staff@freshguard.app` / `demo1234` → **staff** (직원) - 제한적 접근

---

## 조직/매장 구조

| 항목 | 상태 | 설명 |
|------|------|------|
| Organization 타입 | ✅ 완료 | id, name, type, ownerId |
| AppStore 타입 | ✅ 완료 | id, organizationId, name, address, type |
| AuthUser 타입 | ✅ 완료 | id, email, name, role, organizationId, storeIds |
| 매장 전환 UI | ✅ 완료 | 헤더 드롭다운, switchStore() 함수 |
| 데모 조직/매장 | ✅ 완료 | 강남점 + 홍대점 2개 |
| storeId 마이그레이션 | ✅ 완료 | 기존 데이터 storeId = "store_gangnnam" 기본값 |

---

## 권한 기반 UI 제한

| 역할 | 대시보드 | 품목 | 입고/개봉 | 폐기 | 위치관리 | 위생점검 | 직원관리 | 리포트 | 구독/결제 | 설정 |
|------|---------|------|----------|------|---------|---------|---------|-------|---------|-----|
| owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| hq_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| staff | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | 🔒 | 🔒 | 🔒 | 🔒 |

- 🔒 = 클릭 시 "접근 권한이 없습니다" 토스트 표시 (메뉴 삭제 없음)

---

## 서비스 레이어

| 파일 | 상태 | 내용 |
|------|------|------|
| services/storageService.ts | ✅ 완료 | LS key 관리, load/save/clear 함수 |
| services/authService.ts | ✅ 완료 | mock auth, 데모 계정, 권한 테이블 |
| services/itemService.ts | ✅ 완료 | storeId 필터, 통계 헬퍼, API stub |
| services/stockService.ts | ✅ 완료 | 재고로그 필터, 통계 헬퍼, API stub |

---

## 코드 품질

- React.lazy + Suspense: 12개 화면 전부 적용
- localStorage 영속성: 6개 앱 키 + 2개 auth 키
- TypeScript 타입 안전: 모든 상태/함수
- migrateItem(): 구버전 localStorage 자동 변환
- 백엔드 전환 준비: 서비스 레이어에 API stub 주석 포함

---

## Railway API 모드 현황 (3차 완료)

> FreshGuard의 기본 운영 방향: **Vercel + Railway + PostgreSQL (api 모드)**

| 레이어 | 파일 | 상태 | 설명 |
|--------|------|------|------|
| API 클라이언트 | lib/apiClient.ts | ✅ 완료 | isApiEnabled(), Bearer 토큰, apiGet/Post/Patch/Delete |
| 환경변수 | .env.example | ✅ 완료 | VITE_BACKEND_MODE=api, VITE_API_BASE_URL 추가 |
| 인증 api 모드 | repositories/authRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 품목 api 모드 | repositories/itemRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 재고 api 모드 | repositories/stockRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 폐기 api 모드 | repositories/disposalRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 보관위치 api 모드 | repositories/storageLocationRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 위생점검 api 모드 | repositories/hygieneRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |
| 직원 api 모드 | repositories/staffRepository.ts | ✅ 완료 | api/supabase/local 3-way 분기 |

## FastAPI 백엔드 Scaffold 현황

| 파일 | 상태 | 설명 |
|------|------|------|
| backend/app/main.py | ✅ 완료 | FastAPI 앱, CORS, /health, 라우터 등록 |
| backend/app/core/config.py | ✅ 완료 | DATABASE_URL, JWT_SECRET 등 환경변수 |
| backend/app/core/security.py | ✅ 완료 | bcrypt 해싱, JWT 발급/검증 |
| backend/app/db/session.py | ✅ 완료 | DB 미설정 시 앱 기동 가능 |
| backend/app/models/ | ✅ 완료 | 14개 SQLAlchemy 모델 |
| backend/app/schemas/ | ✅ 완료 | Pydantic v2 스키마 (camelCase 응답) |
| backend/app/api/routes/auth.py | ✅ 완료 | signup/login/logout/me/onboarding |
| backend/app/api/routes/items.py | ✅ 완료 | CRUD + stock-status |
| backend/app/api/routes/stock.py | ✅ 완료 | 재고 로그 조회/생성 |
| backend/app/api/routes/disposal.py | ✅ 완료 | 폐기 기록 CRUD |
| backend/app/api/routes/storage_locations.py | ✅ 완료 | 보관 위치 CRUD |
| backend/app/api/routes/hygiene.py | ✅ 완료 | 템플릿/세션/체크아이템 |
| backend/app/api/routes/staff.py | ✅ 완료 | 직원 목록/초대/수정/삭제 |
| backend/app/api/routes/reports.py | ✅ 완료 | summary/disposal-trends/category-distribution |
| backend/alembic/ | ✅ 완료 | Alembic 설정, env.py |
| backend/requirements.txt | ✅ 완료 | FastAPI, SQLAlchemy, Alembic 등 |
| backend/README.md | ✅ 완료 | 로컬 실행 방법, migration 명령어 |

## Supabase 백엔드 연동 현황 (optional 모드 — 참고용 보존)

| 레이어 | 파일 | 상태 | 설명 |
|--------|------|------|------|
| DB 클라이언트 | lib/supabaseClient.ts | ✅ 완료 | isSupabaseEnabled() 헬퍼 |
| 매핑 함수 | repositories/mappers.ts | ✅ 완료 | 16개 camelCase↔snake_case 변환 |
| 인증 | repositories/authRepository.ts | ✅ 완료 | 7단계 워크스페이스 생성, 세션 복원 |
| 나머지 repositories | (각 파일) | ✅ 완료 | supabase 분기 유지 |

## Railway 실제 연결 현황 (4차 완료 — 2026-05-25)

| 항목 | 상태 | 결과 |
|------|------|------|
| Railway PostgreSQL 프로비저닝 | ✅ 완료 | striking-delight 프로젝트 |
| DATABASE_PUBLIC_URL 로컬 연결 | ✅ 완료 | yamanote.proxy.rlwy.net |
| postgres:// → postgresql:// 자동 변환 | ✅ 완료 | config.py get_database_url() |
| Railway SSL 자동 처리 | ✅ 완료 | session.py connect_args |
| bcrypt 4.0.1 고정 (passlib 호환) | ✅ 완료 | requirements.txt |
| Alembic 초기 마이그레이션 생성 | ✅ 완료 | bde2c9bcffe6_initial_schema.py |
| alembic upgrade head 실행 | ✅ 완료 | 14개 테이블 Railway DB 생성 |
| GET /health | ✅ 완료 | {"status":"ok"} |
| smoke_api.py | ✅ 완료 | **20/20 PASS** |
| local 모드 회귀 빌드 | ✅ 완료 | 빌드 성공 |

## 남은 작업 (다음 스프린트)

### Railway 백엔드 서비스 배포
- [ ] Railway에 FastAPI 서비스 배포 (GitHub 연결)
- [ ] Railway 서비스 환경변수 설정 (DATABASE_URL, JWT_SECRET 등)
- [ ] Vercel 프론트엔드 배포
- [ ] Vercel 환경변수에 VITE_API_BASE_URL=Railway URL 설정

### 기능 추가
- [ ] 스태프 이메일 초대 (AWS SES 또는 SendGrid)
- [ ] 다매장 통합 대시보드 (hq_admin 전용)
- [ ] 실시간 알림 (WebSocket 또는 FCM)
- [ ] 위생점검 사진 첨부 (S3 또는 Railway Volume)
- [ ] 결제/구독 연동 (Stripe 또는 토스페이먼츠)
- [ ] 카카오톡 알림 연동
- [ ] 비밀번호 재설정 이메일 발송 (현재 stub)
