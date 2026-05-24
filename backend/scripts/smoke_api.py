"""
FreshGuard API 스모크 테스트 스크립트

사용법:
    # backend/ 디렉토리에서 uvicorn 서버를 먼저 실행
    # uvicorn app.main:app --reload --port 8000

    # 다른 터미널에서
    python scripts/smoke_api.py

    # 서버 주소를 바꾸려면
    BASE_URL=http://localhost:8001 python scripts/smoke_api.py
"""

import os
import sys
import json
import uuid
import urllib.request
import urllib.error

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
TEST_EMAIL = f"smoke_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "Smoke1234!"

_token: str | None = None
_store_id: str | None = None
_org_id: str | None = None
_item_id: str | None = None

PASS = "PASS"
FAIL = "FAIL"
results: list[tuple[str, str, str]] = []


# ─── HTTP helpers ─────────────────────────────────────────────────────────────

def _headers(auth: bool = True) -> dict:
    h = {"Content-Type": "application/json"}
    if auth and _token:
        h["Authorization"] = f"Bearer {_token}"
    return h


def _req(method: str, path: str, body: dict | None = None, auth: bool = True):
    url = BASE_URL + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=_headers(auth), method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        return e.code, json.loads(raw) if raw else {}
    except Exception as e:
        return 0, {"error": str(e)}


def ok(label: str, status: int, body: dict, *, expect: int = 200) -> bool:
    passed = status == expect
    results.append((PASS if passed else FAIL, label, f"HTTP {status}"))
    if not passed:
        print(f"  [!] {label} — got {status}, expected {expect}: {body}")
    return passed


# ─── Test cases ───────────────────────────────────────────────────────────────

def test_health():
    status, body = _req("GET", "/health", auth=False)
    ok("GET /health", status, body)


def test_signup():
    global _token, _store_id, _org_id
    status, body = _req(
        "POST", "/api/v1/auth/signup",
        {"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "스모크유저", "orgType": "individual"},
        auth=False,
    )
    if ok("POST /api/v1/auth/signup", status, body, expect=201):
        _token = body.get("accessToken")
        stores = body.get("stores", [])
        if stores:
            _store_id = stores[0].get("id")
        org = body.get("org")
        if org:
            _org_id = org.get("id")


def test_login():
    global _token
    status, body = _req(
        "POST", "/api/v1/auth/login",
        {"email": TEST_EMAIL, "password": TEST_PASSWORD},
        auth=False,
    )
    if ok("POST /api/v1/auth/login", status, body):
        _token = body.get("accessToken")


def test_me():
    status, body = _req("GET", "/api/v1/auth/me")
    ok("GET /api/v1/auth/me", status, body)


def test_onboarding():
    if not _org_id or not _store_id:
        results.append(("SKIP", "POST /api/v1/auth/onboarding", "no org/store"))
        return
    status, body = _req(
        "POST", "/api/v1/auth/onboarding",
        {
            "organizationId": _org_id,
            "storeId": _store_id,
            "orgName": "스모크 F&B",
            "storeName": "스모크 1호점",
            "businessType": "restaurant",
        },
    )
    ok("POST /api/v1/auth/onboarding", status, body, expect=204)


def test_items_crud():
    global _item_id
    if not _store_id or not _org_id:
        results.append(("SKIP", "Items CRUD", "no store_id"))
        return

    from datetime import date, timedelta
    today = date.today().isoformat()
    expiry = (date.today() + timedelta(days=7)).isoformat()

    # Create
    status, body = _req(
        "POST", "/api/v1/items",
        {
            "name": "스모크 테스트 식재료",
            "category": "채소",
            "receivedDate": today,
            "expiryDate": expiry,
            "quantity": 3.0,
            "unit": "개",
            "stockStatus": "unopened",
            "storeId": _store_id,
            "organizationId": _org_id,
        },
    )
    if ok("POST /api/v1/items", status, body, expect=201):
        _item_id = body.get("id")

    # List
    status, body = _req("GET", f"/api/v1/items?storeId={_store_id}")
    ok("GET /api/v1/items", status, body)

    if _item_id:
        # Update
        status, body = _req("PATCH", f"/api/v1/items/{_item_id}", {"quantity": 2.0})
        ok("PATCH /api/v1/items/{id}", status, body)

        # Stock status
        status, body = _req(
            "PATCH", f"/api/v1/items/{_item_id}/stock-status",
            {"stockStatus": "opened", "openedDate": today},
        )
        ok("PATCH /api/v1/items/{id}/stock-status", status, body)

        # Delete
        status, body = _req("DELETE", f"/api/v1/items/{_item_id}")
        ok("DELETE /api/v1/items/{id}", status, body, expect=204)


def test_stock_logs():
    if not _store_id or not _org_id:
        results.append(("SKIP", "Stock logs", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/stock-logs?storeId={_store_id}")
    ok("GET /api/v1/stock-logs", status, body)


def test_disposal():
    if not _store_id or not _org_id:
        results.append(("SKIP", "Disposal records", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/disposal-records?storeId={_store_id}")
    ok("GET /api/v1/disposal-records", status, body)


def test_storage_locations():
    if not _store_id or not _org_id:
        results.append(("SKIP", "Storage locations", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/storage-locations?storeId={_store_id}")
    ok("GET /api/v1/storage-locations", status, body)


def test_hygiene():
    if not _store_id:
        results.append(("SKIP", "Hygiene templates", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/hygiene/templates?storeId={_store_id}")
    ok("GET /api/v1/hygiene/templates", status, body)

    status, body = _req("GET", f"/api/v1/hygiene/sessions?storeId={_store_id}")
    ok("GET /api/v1/hygiene/sessions", status, body)


def test_staff():
    if not _store_id:
        results.append(("SKIP", "Staff list", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/staff?storeId={_store_id}")
    ok("GET /api/v1/staff", status, body)


def test_reports():
    if not _store_id:
        results.append(("SKIP", "Reports", "no store_id"))
        return
    status, body = _req("GET", f"/api/v1/reports/summary?storeId={_store_id}")
    ok("GET /api/v1/reports/summary", status, body)

    status, body = _req("GET", f"/api/v1/reports/disposal-trends?storeId={_store_id}&months=3")
    ok("GET /api/v1/reports/disposal-trends", status, body)

    status, body = _req("GET", f"/api/v1/reports/category-distribution?storeId={_store_id}")
    ok("GET /api/v1/reports/category-distribution", status, body)


def test_logout():
    status, body = _req("POST", "/api/v1/auth/logout")
    ok("POST /api/v1/auth/logout", status, body, expect=204)


# ─── Runner ───────────────────────────────────────────────────────────────────

def main():
    print(f"\nFreshGuard API Smoke Test — {BASE_URL}\n{'='*50}")

    test_health()
    test_signup()
    test_login()
    test_me()
    test_onboarding()
    test_items_crud()
    test_stock_logs()
    test_disposal()
    test_storage_locations()
    test_hygiene()
    test_staff()
    test_reports()
    test_logout()

    print(f"\n{'─'*50}")
    passed = sum(1 for r in results if r[0] == PASS)
    failed = sum(1 for r in results if r[0] == FAIL)
    skipped = sum(1 for r in results if r[0] == "SKIP")

    for status, label, detail in results:
        icon = "OK" if status == PASS else ("--" if status == "SKIP" else "NG")
        print(f"  [{icon}] {label:50s} {detail}")

    print(f"\n  Total: {len(results)}  Pass: {passed}  Fail: {failed}  Skip: {skipped}\n")

    if failed:
        print("Smoke test FAILED")
        sys.exit(1)
    else:
        print("Smoke test PASSED")


if __name__ == "__main__":
    main()
