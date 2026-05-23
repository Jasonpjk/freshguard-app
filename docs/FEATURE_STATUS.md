# FreshGuard — 기능 구현 현황

> 최종 업데이트: 2026-05-23

## 완료된 화면 (11개)

| 화면 | 컴포넌트 | 상태 | 설명 |
|------|----------|------|------|
| 대시보드 | Dashboard.tsx | ✅ 완료 | 소비기한 현황 6카드 + 입고/개봉 현황 4카드 + 우선처리 테이블 |
| 품목 관리 | ItemsManagement.tsx | ✅ 완료 | CRUD, 검색/필터, 소비기한 상태 배지 |
| 소비기한 캘린더 | ExpiryCalendar.tsx | ✅ 완료 | 월간 캘린더, 날짜별 품목 표시 |
| 입고/개봉 관리 | StockManagement.tsx | ✅ 완료 | 재고흐름 (미개봉→개봉→사용완료/폐기), 입고 등록 모달, 개봉 처리 모달 |
| 폐기 기록 | DisposalRecords.tsx | ✅ 완료 | 폐기 목록, 승인/대기 상태, 월별 손실 합계 |
| 보관 위치 관리 | StorageLocations.tsx | ✅ 완료 | 위치 카드, 품목 통계, CRUD 모달 |
| 위생점검 | HygieneCheck.tsx | ✅ 완료 | 체크리스트, 카테고리 필터, 점검 이력 |
| 직원 관리 | StaffManagement.tsx | ✅ 완료 | 직원 목록, 역할/상태 필터, 초대/편집/삭제 |
| 리포트 | Reports.tsx | ✅ 완료 | recharts 차트 (Line, Bar, Pie) |
| 구독/결제 | Subscription.tsx | ✅ 완료 | 요금제 4단계, 결제 수단 표시 |
| 설정 | AppSettings.tsx | ✅ 완료 | 매장정보, 알림, 기준일수, 카테고리, 데이터 초기화 |
| 모바일 뷰 | MobileView.tsx | ✅ 완료 | 5탭 + 빠른 실행 버튼 5개 |

## 글로벌 상태 (AppContext)

| 상태 | 타입 | localStorage 키 |
|------|------|-----------------|
| items | Item[] | fg_items |
| disposalRecords | DisposalRecord[] | fg_disposal |
| locations | StorageLocation[] | fg_locations |
| staff | StaffMember[] | fg_staff |
| settings | AppSettings | fg_settings |
| stockLogs | StockLog[] | fg_stock_logs |

## Item 인터페이스 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| id | number | 고유 ID (Date.now()) |
| name | string | 품목명 |
| category | string | 카테고리 |
| receivedDate | string | 입고일 |
| openedDate | string \| null | 개봉일 |
| expiryDate | string | 소비기한 |
| useAfterOpenDays | number \| null | 개봉 후 유효일 (레거시) |
| openedShelfLifeDays | number \| null | 개봉 후 유효일 (신규) |
| location | string | 보관 위치 |
| quantity | number | 수량 |
| unit | string | 단위 |
| status | ItemStatus | computed: expired/urgent/warning/normal |
| stockStatus | StockStatus | unopened/opened/used/disposed |
| assignee | string | 담당자 |
| qrLabelEnabled | boolean | QR 라벨 여부 |
| memo | string | 메모 |
| cost | number | 단위 원가 |

## 코드 품질

- React.lazy + Suspense: 12개 화면 전부 적용 (코드 스플리팅)
- localStorage 영속성: 6개 키 자동 저장/복원
- 타입 안전: 모든 상태/함수에 TypeScript 타입 적용
- 마이그레이션: 구버전 localStorage 데이터 자동 변환 (migrateItem)
