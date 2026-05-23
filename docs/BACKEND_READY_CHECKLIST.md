# FreshGuard — 백엔드 전환 준비 체크리스트

> 최종 업데이트: 2026-05-23

---

## 현재 구현 상태 (프론트엔드 Mock)

| 항목 | 방식 | 전환 필요 |
|------|------|----------|
| 인증 | localStorage mock | JWT / 세션 API |
| 데이터 저장 | localStorage | REST API + DB |
| 권한 | 프론트 UI 제한만 | 백엔드 미들웨어 |
| 파일 업로드 | 미구현 | S3 / GCS |
| 실시간 알림 | 미구현 | FCM / WebSocket |

---

## Phase 1: 인증 API

| API | Method | 설명 |
|-----|--------|------|
| /auth/login | POST | 이메일+비밀번호 → JWT access/refresh token |
| /auth/signup | POST | 회원가입 → 사용자 생성 + 이메일 인증 발송 |
| /auth/logout | POST | refresh token 무효화 |
| /auth/refresh | POST | access token 재발급 |
| /auth/password-reset | POST | 재설정 링크 이메일 발송 |
| /auth/password-reset/confirm | POST | 새 비밀번호 설정 |
| /auth/me | GET | 현재 사용자 정보 |

---

## Phase 2: 조직/매장 API

| API | Method | 설명 |
|-----|--------|------|
| /organizations/current | GET | 내 조직 정보 |
| /organizations/current | PUT | 조직 정보 수정 |
| /stores | GET | 조직의 매장 목록 |
| /stores | POST | 새 매장 추가 |
| /stores/:id | GET | 매장 상세 |
| /stores/:id | PUT | 매장 정보 수정 |
| /stores/:id | DELETE | 매장 삭제 |
| /stores/:id/switch | POST | 현재 매장 전환 |

---

## Phase 3: 품목/재고 API

| API | Method | 설명 |
|-----|--------|------|
| /items | GET | 재고 품목 목록 (필터: storeId, stockStatus, status) |
| /items | POST | 품목 추가 (직접 등록) |
| /items/receive | POST | 입고 등록 |
| /items/:id | GET | 품목 상세 |
| /items/:id | PUT | 품목 수정 |
| /items/:id | DELETE | 품목 삭제 |
| /items/:id/open | POST | 개봉 처리 |
| /items/:id/use | POST | 사용 완료 |
| /items/:id/dispose | POST | 폐기 처리 |
| /stock-logs | GET | 재고 로그 목록 (날짜/타입 필터) |

---

## Phase 4: 폐기/보관 API

| API | Method | 설명 |
|-----|--------|------|
| /disposal-records | GET | 폐기 기록 목록 |
| /disposal-records | POST | 폐기 기록 등록 |
| /disposal-records/:id/approve | PATCH | 폐기 승인 |
| /disposal-records/:id/reject | PATCH | 폐기 거부 |
| /locations | GET | 보관 위치 목록 |
| /locations | POST | 위치 추가 |
| /locations/:id | PUT | 위치 수정 |
| /locations/:id | DELETE | 위치 삭제 |

---

## Phase 5: 직원/위생 API

| API | Method | 설명 |
|-----|--------|------|
| /staff | GET | 직원 목록 |
| /staff/invite | POST | 직원 초대 이메일 발송 |
| /staff/:id | PATCH | 역할/상태 변경 |
| /staff/:id | DELETE | 직원 삭제 |
| /hygiene/templates | GET | 위생점검 템플릿 |
| /hygiene/sessions | GET | 점검 이력 |
| /hygiene/sessions | POST | 점검 세션 시작 |
| /hygiene/sessions/:id | PATCH | 항목 체크 업데이트 |

---

## Phase 6: 리포트/설정 API

| API | Method | 설명 |
|-----|--------|------|
| /reports/summary | GET | 대시보드 통계 요약 |
| /reports/disposal-trends | GET | 폐기 트렌드 |
| /reports/expiry-calendar | GET | 소비기한 캘린더 데이터 |
| /settings | GET | 매장 설정 조회 |
| /settings | PUT | 매장 설정 저장 |
| /subscription/current | GET | 구독 정보 |
| /subscription/change | POST | 요금제 변경 |
| /subscription | DELETE | 구독 취소 |

---

## 서비스 레이어 전환 방법

현재 `src/app/services/` 폴더의 각 파일에 API stub이 주석으로 포함되어 있습니다.

### storageService.ts → API 전환 예시
```typescript
// 현재 (localStorage)
export function loadFromStorage<T>(key, fallback) { ... }

// 전환 후 (API)
export async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    credentials: "include",
    headers: { "Authorization": `Bearer ${getAccessToken()}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### AppContext 전환 포인트
- `useState` 초기값의 `load()` 호출 → `useQuery()` (TanStack Query)
- `useCallback` 함수 내 `setItems()` → `useMutation()` + `queryClient.invalidateQueries()`
- `useEffect` + `save()` → 불필요 (서버가 저장소)

---

## 보안 체크리스트

- [ ] HTTPS 강제 적용 (HTTP → HTTPS 리다이렉트)
- [ ] JWT 비밀키 환경변수 관리 (NEXTAUTH_SECRET 등)
- [ ] Refresh token httpOnly 쿠키 저장 (localStorage 금지)
- [ ] API Rate Limiting (로그인: 5회/분, 일반: 100회/분)
- [ ] CORS 화이트리스트 설정
- [ ] SQL Injection 방어 (ORM prepared statement)
- [ ] XSS 방어 (응답 JSON 자동 이스케이프)
- [ ] 민감 데이터 암호화 (결제 카드 정보)
- [ ] 로그 감사 (관리자 액션 audit log)

---

## 인프라 준비 체크리스트

- [ ] Node.js (Fastify/NestJS) 또는 Python (FastAPI) 백엔드 선택
- [ ] MySQL 8+ 또는 PostgreSQL 14+ 데이터베이스
- [ ] Redis (세션 캐시 / 작업 큐)
- [ ] AWS S3 또는 GCS (사진 첨부 저장)
- [ ] Firebase FCM (푸시 알림)
- [ ] 이메일 서비스 (AWS SES / SendGrid) - 비밀번호 재설정
- [ ] CI/CD 파이프라인 (GitHub Actions → 자동 배포)
- [ ] 모니터링: Sentry (에러) + Grafana (성능) + UptimeRobot (가용성)
