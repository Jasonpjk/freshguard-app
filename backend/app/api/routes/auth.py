import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...core.security import hash_password, verify_password, create_access_token
from ...models.user import User, StoreMember
from ...models.organization import Organization
from ...models.store import Store
from ...models.subscription import AppSettings
from ...schemas.auth import (
    SignupRequest, LoginRequest, TokenResponse, MeResponse,
    OnboardingRequest, PasswordResetRequest,
    OrgResponse, StoreResponse, UserResponse,
)
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_to_response(user: User, org: Organization | None, stores: list[Store]) -> dict:
    org_res = OrgResponse(
        id=org.id, name=org.name, type=org.type,
        ownerId=org.owner_id,
        createdAt=org.created_at.date().isoformat() if org.created_at else "",
    ) if org else None

    store_res = [
        StoreResponse(id=s.id, organizationId=s.organization_id, name=s.name, address=s.address or "", type=s.type or "restaurant")
        for s in stores
    ]

    user_res = UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        organizationId=user.organization_id or "",
        storeIds=[s.id for s in stores],
    )

    return {"user": user_res, "org": org_res, "stores": store_res}


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    store_id = str(uuid.uuid4())

    # 1. organization 생성
    org = Organization(id=org_id, name=f"{body.name}의 조직", type=body.orgType, plan="free")
    db.add(org)

    # 2. store 생성
    store = Store(id=store_id, organization_id=org_id, name="내 매장", type="restaurant", is_active=True)
    db.add(store)

    # 3. user 생성
    user = User(
        id=user_id,
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role="owner",
        organization_id=org_id,
        is_active=True,
    )
    db.add(user)

    # 4. store_member 생성
    member = StoreMember(user_id=user_id, store_id=store_id, role="owner")
    db.add(member)

    db.flush()

    # 5. owner_id 업데이트
    org.owner_id = user_id

    # 6. app_settings 기본값 생성
    settings_row = AppSettings(
        organization_id=org_id,
        store_id=store_id,
        warning_days=3,
        urgent_days=1,
        default_open_use_days=3,
        notify_expired=True,
        notify_urgent=True,
        notify_warning=False,
    )
    db.add(settings_row)

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    workspace = _user_to_response(user, org, [store])

    return TokenResponse(
        accessToken=token,
        user=workspace["user"],
        org=workspace["org"],
        stores=workspace["stores"],
        needsOnboarding=True,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    org = db.query(Organization).filter(Organization.id == user.organization_id).first() if user.organization_id else None
    store_ids = [m.store_id for m in db.query(StoreMember).filter(StoreMember.user_id == user.id).all()]
    stores = db.query(Store).filter(Store.id.in_(store_ids), Store.is_active == True).all() if store_ids else []

    needs_onboarding = org is None or not stores

    token = create_access_token(user.id)
    workspace = _user_to_response(user, org, stores)

    return TokenResponse(
        accessToken=token,
        user=workspace["user"],
        org=workspace["org"],
        stores=workspace["stores"],
        needsOnboarding=needs_onboarding,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_active_user)):
    # JWT는 stateless이므로 서버에서 별도 처리 없음. 클라이언트가 토큰 삭제.
    return None


@router.post("/password-reset", status_code=status.HTTP_204_NO_CONTENT)
def password_reset(body: PasswordResetRequest, db: Session = Depends(get_db)):
    # TODO: 실제 이메일 발송 (AWS SES, SendGrid 등) 연동
    # 현재는 구조만 준비, 실제 메일 발송 없음
    return None


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first() if current_user.organization_id else None
    store_ids = [m.store_id for m in db.query(StoreMember).filter(StoreMember.user_id == current_user.id).all()]
    stores = db.query(Store).filter(Store.id.in_(store_ids)).all() if store_ids else []

    workspace = _user_to_response(current_user, org, stores)

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        organizationId=current_user.organization_id or "",
        storeIds=[s.id for s in stores],
        org=workspace["org"],
        stores=workspace["stores"],
    )


@router.post("/onboarding", status_code=status.HTTP_204_NO_CONTENT)
def onboarding(
    body: OnboardingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == body.organizationId).first()
    if org and org.owner_id == current_user.id:
        org.name = body.orgName

    store = db.query(Store).filter(
        Store.id == body.storeId,
        Store.organization_id == body.organizationId,
    ).first()
    if store:
        store.name = body.storeName
        store.type = body.businessType

    db.commit()
    return None
