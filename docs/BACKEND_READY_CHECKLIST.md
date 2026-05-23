# FreshGuard — 백엔드 전환 준비 체크리스트

> 최종 업데이트: 2026-05-23

이 문서는 현재 localStorage 기반 프론트엔드를 실제 백엔드 API로 전환할 때 필요한 작업 목록입니다.

---

## Phase 1: 백엔드 API 설계 및 구현

### 인증/인가
- [ ] JWT 기반 인증 (access token + refresh token)
- [ ] 역할 기반 권한 (owner > manager > staff)
- [ ] 매장별 데이터 격리 (store_id 기반)

### REST API 엔드포인트

#### 품목 (Items / StockItems)
- [ ] `GET /api/items` — 재고 품목 목록 (필터: stockStatus, status, category, location)
- [ ] `POST /api/items/receive` — 입고 등록
- [ ] `PATCH /api/items/:id/open` — 개봉 처리
- [ ] `PATCH /api/items/:id/used` — 사용 완료
- [ ] `DELETE /api/items/:id/dispose` — 폐기 처리
- [ ] `GET /api/items/:id` — 품목 상세
- [ ] `PUT /api/items/:id` — 품목 수정
- [ ] `DELETE /api/items/:id` — 품목 삭제

#### 재고 로그 (StockLogs)
- [ ] `GET /api/stock-logs` — 로그 목록 (날짜, 타입 필터)
- [ ] 자동 생성: receive/open/used/dispose 액션 시 서버에서 생성

#### 폐기 기록 (DisposalRecords)
- [ ] `GET /api/disposal-records` — 폐기 기록 목록
- [ ] `POST /api/disposal-records` — 폐기 기록 등록
- [ ] `PATCH /api/disposal-records/:id/approve` — 승인
- [ ] `PATCH /api/disposal-records/:id/reject` — 거부

#### 보관 위치 (StorageLocations)
- [ ] `GET /api/locations` — 위치 목록
- [ ] `POST /api/locations` — 위치 추가
- [ ] `PUT /api/locations/:id` — 위치 수정
- [ ] `DELETE /api/locations/:id` — 위치 삭제

#### 직원 (Users/Staff)
- [ ] `GET /api/staff` — 직원 목록
- [ ] `POST /api/staff/invite` — 초대 (이메일 발송)
- [ ] `PATCH /api/staff/:id` — 역할/상태 변경
- [ ] `DELETE /api/staff/:id` — 삭제

#### 위생점검 (HygieneCheck)
- [ ] `GET /api/hygiene/templates` — 점검 항목 템플릿
- [ ] `POST /api/hygiene/sessions` — 점검 세션 시작
- [ ] `PATCH /api/hygiene/sessions/:id` — 항목 체크 업데이트
- [ ] `GET /api/hygiene/sessions` — 점검 이력

#### 설정 (Settings)
- [ ] `GET /api/settings` — 설정 조회
- [ ] `PUT /api/settings` — 설정 저장

#### 구독 (Subscription)
- [ ] `GET /api/subscription` — 구독 정보
- [ ] `POST /api/subscription/change` — 요금제 변경
- [ ] `DELETE /api/subscription` — 구독 취소
- [ ] 결제 PG 연동 (토스페이먼츠 or KG이니시스)

---

## Phase 2: 프론트엔드 전환

### AppContext 수정
- [ ] 각 `useState` → React Query `useQuery` / `useMutation`으로 교체
- [ ] localStorage 저장 로직 → API 호출로 교체
- [ ] 낙관적 업데이트(Optimistic Update) 구현

### 인증 플로우
- [ ] 로그인 페이지 구현
- [ ] 토큰 저장 (httpOnly 쿠키 권장)
- [ ] PrivateRoute로 인증 없이 접근 차단

### 마이그레이션 도구
- [ ] 기존 localStorage 데이터를 서버로 업로드하는 일회성 마이그레이션 스크립트

---

## Phase 3: 인프라 및 운영

### 서버 구성
- [ ] Node.js (Express/Fastify) 또는 Python (FastAPI) 백엔드
- [ ] MySQL / PostgreSQL 데이터베이스
- [ ] Redis (세션 캐시, 실시간 알림 큐)

### 알림 시스템
- [ ] 소비기한 임박 푸시 알림 (Firebase FCM)
- [ ] 카카오톡 알림 연동 (KakaoTalk Business API)
- [ ] 배치 스케줄러 (매일 오전 8시 점검)

### 파일 저장
- [ ] 위생점검 사진 첨부 → S3 또는 GCS 업로드

### 보안
- [ ] HTTPS 강제 적용
- [ ] API Rate Limiting
- [ ] SQL Injection / XSS 방어
- [ ] 민감 데이터 암호화 (결제 정보)

### 모니터링
- [ ] 서버 에러 모니터링 (Sentry)
- [ ] API 응답 시간 모니터링 (Grafana)
- [ ] 업타임 체크 (UptimeRobot)

---

## 현재 localStorage → API 매핑 테이블

| localStorage 키 | API 엔드포인트 |
|-----------------|---------------|
| fg_items | GET/POST /api/items |
| fg_disposal | GET/POST /api/disposal-records |
| fg_locations | GET/POST /api/locations |
| fg_staff | GET/POST /api/staff |
| fg_settings | GET/PUT /api/settings |
| fg_stock_logs | GET /api/stock-logs (읽기 전용) |
