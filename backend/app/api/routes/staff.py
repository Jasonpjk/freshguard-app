from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User, StoreMember
from ...schemas.user import StaffMemberResponse, StaffInviteRequest, StaffUpdateRequest
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/staff", tags=["staff"])


def _member_to_response(member: StoreMember) -> StaffMemberResponse:
    user = member.user
    return StaffMemberResponse(
        id=user.id if user else member.user_id,
        name=user.name if user else "",
        role=member.role,
        phone=user.phone if user else None,
        store=member.store.name if member.store else "",
        email=user.email if user else "",
        lastActive=user.last_active_at.date().isoformat() if user and user.last_active_at else None,
        status="active" if (user and user.is_active) else "inactive",
    )


@router.get("", response_model=list[StaffMemberResponse])
def list_staff(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    members = db.query(StoreMember).filter(StoreMember.store_id == storeId).all()
    return [_member_to_response(m) for m in members]


@router.post("/invite", status_code=204)
def invite_staff(
    body: StaffInviteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="초대 권한이 없습니다.")

    # TODO: 이메일 발송 (AWS SES, SendGrid 등) 연동
    # 현재는 이미 가입된 유저를 이메일로 검색해 store_member에 추가
    target_user = db.query(User).filter(User.email == body.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="해당 이메일로 가입된 사용자가 없습니다.")

    existing = db.query(StoreMember).filter(
        StoreMember.user_id == target_user.id,
        StoreMember.store_id == body.storeId,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 해당 매장의 직원입니다.")

    member = StoreMember(user_id=target_user.id, store_id=body.storeId, role=body.role)
    db.add(member)
    db.commit()
    return None


@router.patch("/{user_id}", status_code=204)
def update_staff(
    user_id: str,
    body: StaffUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="직원 수정 권한이 없습니다.")

    member = db.query(StoreMember).filter(
        StoreMember.user_id == user_id,
        StoreMember.store_id == body.storeId,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    if body.role:
        member.role = body.role

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if body.name:
            user.name = body.name
        if body.phone:
            user.phone = body.phone
        if body.status:
            user.is_active = body.status == "active"

    db.commit()
    return None


@router.delete("/{user_id}", status_code=204)
def remove_staff(
    user_id: str,
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="직원 삭제 권한이 없습니다.")

    member = db.query(StoreMember).filter(
        StoreMember.user_id == user_id,
        StoreMember.store_id == storeId,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    db.delete(member)
    db.commit()
    return None
