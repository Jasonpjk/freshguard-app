# FreshGuard — Vercel 배포 가이드

> FreshGuard의 기본 운영 방향: **Vercel (프론트) + Railway (백엔드 + PostgreSQL)**

---

## 1. Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) 접속 후 로그인
2. **Add New Project** 클릭
3. GitHub에서 `freshguard-app` 저장소 Import
4. **Framework Preset**: Vite 선택 (또는 Other)

---

## 2. 빌드 설정

| 항목 | 값 |
|------|-----|
| **Root Directory** | (비워두기, 저장소 루트) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## 3. 환경변수 설정

Vercel 프로젝트 → **Settings** → **Environment Variables**:

### api 모드 (운영)

| Key | Value |
|-----|-------|
| `VITE_BACKEND_MODE` | `api` |
| `VITE_API_BASE_URL` | `https://freshguard-api.up.railway.app` |

> Railway 배포 후 실제 URL로 교체하세요.

### local 모드 (Preview/개발용, 선택)

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_BACKEND_MODE` | `local` | Preview |

### supabase 모드 (대안, 선택)

| Key | Value |
|-----|-------|
| `VITE_BACKEND_MODE` | `supabase` |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

---

## 4. 배포

환경변수 저장 후 **Deploy** 클릭.

또는 GitHub main 브랜치에 push하면 자동 배포됩니다.

---

## 5. Preview 배포 확인

Vercel은 각 PR/브랜치에 대해 자동으로 Preview URL을 생성합니다:
- `https://freshguard-app-git-branch-name.vercel.app`

---

## 6. Production 배포 확인

main 브랜치 머지 → 자동 프로덕션 배포:
- `https://freshguard-app.vercel.app` (기본)
- 커스텀 도메인 추가 가능: **Settings** → **Domains**

---

## 7. 환경변수 적용 순서

1. Railway에서 API URL 확인
2. Vercel에서 `VITE_API_BASE_URL` 업데이트
3. Vercel **Redeploy** (환경변수 변경 시 재배포 필요)

---

## 8. CORS 설정 확인

Vercel 프로덕션 URL이 Railway 백엔드의 `CORS_ORIGINS`에 포함되어 있어야 합니다:

```
CORS_ORIGINS=https://freshguard-app.vercel.app,http://localhost:5173
```

---

## 9. 빌드 실패 시 확인사항

- `npm run build` 로컬에서 성공 여부 확인
- TypeScript 타입 에러 없는지 확인
- 환경변수 이름 오타 여부 확인 (`VITE_` 접두사 필수)
- `vite.config.ts` 에 `base` 설정 필요 시 확인
