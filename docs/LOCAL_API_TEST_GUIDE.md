# FreshGuard — 로컬 API 통합 테스트 가이드

> Railway 실제 연결 전에 로컬 환경에서 프론트엔드 ↔ FastAPI 백엔드 통신을 검증하는 절차입니다.

---

## 사전 준비

### 필요 도구

- Python 3.11+
- Node.js 18+ / npm
- PostgreSQL (로컬 또는 Railway 프리뷰 DB)

### 1. 백엔드 환경 설정

```bash
cd freshguard-app/backend

# 가상환경 생성 및 활성화
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# 패키지 설치
pip install -r requirements.txt
```

`backend/.env` 파일 생성 (`.env.example` 복사 후 수정):

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/freshguard
JWT_SECRET=local-dev-secret-change-in-prod
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173
```

### 2. DB 생성 및 마이그레이션

```bash
# PostgreSQL에 freshguard 데이터베이스 생성
# (psql 또는 pgAdmin에서 실행)
# CREATE DATABASE freshguard;

cd backend

# 최초 마이그레이션 파일 생성
alembic revision --autogenerate -m "initial schema"

# 마이그레이션 적용
alembic upgrade head
```

---

## 백엔드 서버 실행

```bash
# backend/ 디렉토리에서
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 정상 기동되면:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### /health 확인

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"freshguard-api"}
```

---

## 스모크 테스트 (자동)

백엔드 서버가 실행 중인 상태에서:

```bash
# backend/ 디렉토리에서
python scripts/smoke_api.py
```

예상 출력:

```
FreshGuard API Smoke Test — http://localhost:8000
==================================================
──────────────────────────────────────────────────
  [OK] GET /health                               HTTP 200
  [OK] POST /api/v1/auth/signup                  HTTP 201
  [OK] POST /api/v1/auth/login                   HTTP 200
  [OK] GET /api/v1/auth/me                       HTTP 200
  ...
  Total: 18  Pass: 18  Fail: 0  Skip: 0

Smoke test PASSED
```

---

## 프론트엔드 연동 테스트 (수동)

### 1. 프론트엔드 환경변수 설정

`freshguard-app/.env.local` 파일 수정:

```env
VITE_BACKEND_MODE=api
VITE_API_BASE_URL=http://localhost:8000
```

### 2. 프론트엔드 dev 서버 실행

```bash
cd freshguard-app
npm run dev
# http://localhost:5173 에서 확인
```

### 3. 수동 체크리스트

#### 인증 플로우

- [ ] 회원가입 → DB에 users 테이블 row 확인
- [ ] 로그인 → accessToken이 localStorage `fg_api_token` 에 저장
- [ ] 페이지 새로고침 → 세션 유지 (GET /me 호출 확인)
- [ ] 로그아웃 → `fg_api_token` 삭제

#### 품목 관리

- [ ] 품목 등록 → 네트워크 탭에서 POST /api/v1/items 201 응답 확인
- [ ] 품목 목록 → GET /api/v1/items?storeId=... 응답 목록 화면에 표시
- [ ] 품목 수정 → PATCH /api/v1/items/{id} 200 응답 확인
- [ ] 품목 삭제 → DELETE /api/v1/items/{id} 204 응답 확인

#### 재고 관리 (입고/개봉)

- [ ] 개봉 처리 → PATCH /api/v1/items/{id}/stock-status 호출 확인
- [ ] 재고 로그 → GET /api/v1/stock-logs 응답 확인

#### 폐기 기록

- [ ] 폐기 등록 → POST /api/v1/disposal-records 201 응답
- [ ] 폐기 승인 → PATCH /api/v1/disposal-records/{id} 200 응답

#### 보관 위치

- [ ] 위치 추가/수정/삭제 → Storage Locations CRUD 확인

#### 위생점검

- [ ] 템플릿 목록 → GET /api/v1/hygiene/templates 확인
- [ ] 점검 세션 생성 및 체크아이템 업데이트

#### 직원 관리

- [ ] 직원 목록 → GET /api/v1/staff 확인

#### 리포트

- [ ] 대시보드 요약 → GET /api/v1/reports/summary 확인
- [ ] 폐기 추이 → GET /api/v1/reports/disposal-trends 확인

---

## 자주 발생하는 오류

### `DATABASE_URL이 설정되지 않았습니다`

→ `backend/.env` 파일의 `DATABASE_URL` 확인. `.env` 파일이 `backend/` 폴더 안에 있어야 합니다.

### `401 Unauthorized`

→ localStorage에서 `fg_api_token` 삭제 후 재로그인.

### `CORS error (로컬 테스트 시)`

→ `backend/.env`의 `CORS_ORIGINS`에 `http://localhost:5173` 포함 여부 확인.

### `422 Unprocessable Entity`

→ 요청 바디 필드명(camelCase)과 Pydantic 스키마 필드명 불일치. Swagger UI(`/docs`)에서 스키마 확인.

### Alembic migration 오류

```bash
# 현재 migration 상태 확인
alembic current

# 전체 history 확인
alembic history

# head로 강제 적용
alembic upgrade head
```

---

## Swagger UI 활용

서버 기동 후 브라우저에서 `http://localhost:8000/docs` 접속.

1. **POST /api/v1/auth/signup** → 테스트 계정 생성
2. 응답에서 `accessToken` 복사
3. Swagger 우상단 **Authorize** 버튼 → `Bearer {accessToken}` 입력
4. 이후 인증이 필요한 엔드포인트 자유롭게 테스트 가능

---

## Railway 연결 전환

로컬 테스트가 통과하면 `backend/.env`의 `DATABASE_URL`을 Railway PostgreSQL URL로 교체한 뒤 동일한 절차를 반복합니다. 프론트엔드 `.env.local`의 `VITE_API_BASE_URL`은 Railway 배포 URL로 변경합니다.

자세한 Railway 배포 방법은 `RAILWAY_DEPLOYMENT_GUIDE.md` 참조.
