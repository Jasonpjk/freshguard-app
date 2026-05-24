from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.routes import auth, items, stock, disposal, storage_locations, hygiene, staff, reports

app = FastAPI(
    title="FreshGuard API",
    description="소비기한·유통기한·개봉 후 사용기한 관리 SaaS — Railway FastAPI 백엔드",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "freshguard-api"}


# ─── API v1 라우터 등록 ────────────────────────────────────────────────────────

PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(items.router, prefix=PREFIX)
app.include_router(stock.router, prefix=PREFIX)
app.include_router(disposal.router, prefix=PREFIX)
app.include_router(storage_locations.router, prefix=PREFIX)
app.include_router(hygiene.router, prefix=PREFIX)
app.include_router(staff.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)
