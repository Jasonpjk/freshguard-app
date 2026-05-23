# FreshGuard — 기능 구현 현황

> 최종 업데이트: 2026-05-23

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

## 남은 작업 (다음 스프린트)

- [ ] 실제 백엔드 REST API 연동 (storageService → API 교체)
- [ ] JWT 인증 (현재: localStorage mock)
- [ ] ItemsManagement, StockManagement storeId 필터 적용
- [ ] 다매장 통합 대시보드 (hq_admin 전용)
- [ ] 실시간 알림 (WebSocket 또는 FCM)
- [ ] 위생점검 사진 첨부 (S3 업로드)
- [ ] 카카오톡 알림 연동
