# FreshGuard API — FastAPI 백엔드

소비기한·유통기한·개봉 후 사용기한 관리 SaaS의 Railway 배포용 FastAPI 백엔드입니다.

## 기술 스택

- Python 3.11+
- FastAPI + Uvicorn
- SQLAlchemy 2.x (ORM)
- Alembic (DB migration)
- PostgreSQL (Railway)
- Pydantic v2
- python-jose (JWT)
- passlib[bcrypt] (비밀번호 해싱)

---

## 로컬 개발 환경 설정

### 1. Python 가상환경 생성 및 활성화

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

`backend/.env` 파일을 생성하세요 (절대 커밋하지 마세요):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/freshguard
JWT_SECRET=your-very-long-random-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> 로컬 PostgreSQL이 없으면 [Railway](https://railway.app)에서 PostgreSQL 인스턴스를 만들고
> DATABASE_URL을 Railway 대시보드에서 복사하여 사용할 수 있습니다.

### 4. DB Migration 실행

```bash
cd backend

# 최초 migration 파일 생성 (autogenerate)
alembic revision --autogenerate -m "initial schema"

# migration 적용
alembic upgrade head
```

### 5. 서버 실행

```bash
# backend 폴더에서 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. API Health Check

```
GET http://localhost:8000/health
```

응답:
```json
{"status": "ok", "service": "freshguard-api"}
```

### 7. API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 주요 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/auth/signup | 회원가입 |
| POST | /api/v1/auth/login | 로그인 (JWT 발급) |
| POST | /api/v1/auth/logout | 로그아웃 |
| GET  | /api/v1/auth/me | 현재 사용자 정보 |
| POST | /api/v1/auth/onboarding | 온보딩 완료 |
| GET  | /api/v1/items | 품목 목록 |
| POST | /api/v1/items | 품목 생성 |
| PATCH | /api/v1/items/{id} | 품목 수정 |
| DELETE | /api/v1/items/{id} | 품목 삭제 |
| GET  | /api/v1/stock-logs | 재고 로그 |
| POST | /api/v1/stock-logs | 재고 로그 생성 |
| GET  | /api/v1/disposal-records | 폐기 기록 |
| POST | /api/v1/disposal-records | 폐기 기록 생성 |
| PATCH | /api/v1/disposal-records/{id} | 폐기 승인/거부 |
| GET  | /api/v1/storage-locations | 보관 위치 목록 |
| POST | /api/v1/storage-locations | 보관 위치 생성 |
| PATCH | /api/v1/storage-locations/{id} | 보관 위치 수정 |
| DELETE | /api/v1/storage-locations/{id} | 보관 위치 삭제 |
| GET  | /api/v1/hygiene/templates | 위생점검 템플릿 |
| GET  | /api/v1/hygiene/sessions | 위생점검 세션 |
| POST | /api/v1/hygiene/sessions | 세션 생성 |
| PATCH | /api/v1/hygiene/check-items/{id} | 체크항목 업데이트 |
| GET  | /api/v1/staff | 직원 목록 |
| POST | /api/v1/staff/invite | 직원 초대 |
| PATCH | /api/v1/staff/{id} | 직원 정보 수정 |
| DELETE | /api/v1/staff/{id} | 직원 삭제 |
| GET  | /api/v1/reports/summary | 리포트 요약 |
| GET  | /api/v1/reports/disposal-trends | 폐기 추이 |
| GET  | /api/v1/reports/category-distribution | 카테고리별 분포 |

---

## Railway 배포 전 확인사항

- [ ] `requirements.txt` 최신화
- [ ] `alembic upgrade head` 실행 확인
- [ ] `DATABASE_URL` Railway PostgreSQL URL로 설정
- [ ] `JWT_SECRET` 랜덤 긴 문자열로 설정
- [ ] `CORS_ORIGINS`에 Vercel 배포 URL 포함
- [ ] `/health` 응답 확인

자세한 배포 방법은 `../docs/RAILWAY_DEPLOYMENT_GUIDE.md` 참조.
