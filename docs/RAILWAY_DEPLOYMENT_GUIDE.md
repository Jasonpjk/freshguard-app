# FreshGuard — Railway 배포 가이드

> FreshGuard의 기본 운영 방향: **Vercel (프론트) + Railway (백엔드 + PostgreSQL)**

---

## 1. Railway 프로젝트 생성

1. [railway.app](https://railway.app) 접속 후 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택 → `freshguard-app` 저장소 연결
4. Root Directory를 `backend`로 설정

---

## 2. PostgreSQL 데이터베이스 추가

1. 프로젝트 대시보드 → **New Service** → **Database** → **PostgreSQL** 선택
2. 잠시 기다리면 PostgreSQL 서비스가 생성됨
3. PostgreSQL 서비스 클릭 → **Variables** 탭에서 `DATABASE_URL` 확인
   - 형식: `postgresql://postgres:password@host:port/railway`

---

## 3. 백엔드 서비스 환경변수 설정

백엔드 서비스(GitHub에서 배포된 서비스) → **Variables** 탭:

| 변수명 | 값 |
|--------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway 참조 변수) |
| `JWT_SECRET` | `openssl rand -hex 32`로 생성한 랜덤 문자열 |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` |
| `CORS_ORIGINS` | `https://freshguard.vercel.app,http://localhost:5173` |

> ⚠️ `JWT_SECRET`는 절대 GitHub에 커밋하지 마세요.

---

## 4. 배포 설정 (Start Command)

Railway 서비스 → **Settings** → **Deploy** → **Start Command**:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

> Railway는 `$PORT` 환경변수를 자동으로 주입합니다.

**Build Command** (선택):

```bash
pip install -r requirements.txt
```

---

## 5. DB Migration 실행

배포 후 최초 1회 migration을 실행해야 합니다.

Railway 서비스 → **Shell** (또는 Railway CLI):

```bash
alembic upgrade head
```

또는 **Pre-deploy Command**로 설정:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 6. Health Check 확인

배포 완료 후:

```
GET https://freshguard-api.up.railway.app/health
```

응답:
```json
{"status": "ok", "service": "freshguard-api"}
```

---

## 7. Railway API URL 확인

Railway 서비스 → **Settings** → **Domains**:
- 자동 생성 도메인: `https://freshguard-api.up.railway.app` (예시)
- 커스텀 도메인 추가 가능

---

## 8. Vercel 환경변수 업데이트

Railway API URL을 확인한 후 Vercel 프로젝트에 추가:

```
VITE_BACKEND_MODE=api
VITE_API_BASE_URL=https://freshguard-api.up.railway.app
```

자세한 내용은 `VERCEL_DEPLOYMENT_GUIDE.md` 참조.

---

## 9. Railway CLI 설치 (선택)

```bash
# npm
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 배포
railway up

# Shell 접속
railway shell
```

---

## 10. 로컬에서 Railway PostgreSQL 사용

Railway PostgreSQL URL을 `backend/.env`에 넣으면 로컬에서도 Railway DB를 사용할 수 있습니다:

```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xx.railway.app:7373/railway
```

> Railway 대시보드 → PostgreSQL → **Connect** 탭에서 Public URL 확인.

---

## 환경변수 전체 예시 (Railway Variables)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=a1b2c3d4e5f6...64자 랜덤 문자열
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=https://freshguard.vercel.app,http://localhost:5173
```
