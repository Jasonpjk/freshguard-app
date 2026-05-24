import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User
from ...models.hygiene import HygieneCheckTemplate, HygieneCheckSession, HygieneCheckItem
from ...schemas.hygiene import (
    HygieneTemplateResponse, HygieneSessionCreate, HygieneSessionResponse,
    HygieneCheckItemUpdate, HygieneCheckItemResponse,
)
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/hygiene", tags=["hygiene"])


@router.get("/templates", response_model=list[HygieneTemplateResponse])
def list_templates(
    storeId: str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(HygieneCheckTemplate).filter(HygieneCheckTemplate.is_active == True)
    if storeId:
        query = query.filter(
            (HygieneCheckTemplate.store_id == storeId) | (HygieneCheckTemplate.store_id.is_(None))
        )
    else:
        query = query.filter(HygieneCheckTemplate.store_id.is_(None))

    templates = query.order_by(HygieneCheckTemplate.sort_order).all()
    return [
        HygieneTemplateResponse(
            id=t.id, category=t.category, label=t.label,
            required=t.required, sortOrder=t.sort_order, storeId=t.store_id,
        )
        for t in templates
    ]


@router.get("/sessions", response_model=list[HygieneSessionResponse])
def list_sessions(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    sessions = db.query(HygieneCheckSession).filter(
        HygieneCheckSession.store_id == storeId
    ).order_by(HygieneCheckSession.checked_date.desc()).limit(30).all()

    return [
        HygieneSessionResponse(
            id=s.id, storeId=s.store_id, checkerId=s.checker_id,
            checkedDate=str(s.checked_date), totalCount=s.total_count,
            doneCount=s.done_count, status=s.status,
            createdAt=s.created_at.isoformat() if s.created_at else "",
        )
        for s in sessions
    ]


@router.post("/sessions", response_model=HygieneSessionResponse, status_code=201)
def create_session(
    body: HygieneSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    session = HygieneCheckSession(
        id=str(uuid.uuid4()),
        organization_id=body.organizationId,
        store_id=body.storeId,
        checker_id=body.checkerId or current_user.id,
        checked_date=date.fromisoformat(body.checkedDate),
        total_count=body.totalCount,
        done_count=body.doneCount,
        status=body.status,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return HygieneSessionResponse(
        id=session.id, storeId=session.store_id, checkerId=session.checker_id,
        checkedDate=str(session.checked_date), totalCount=session.total_count,
        doneCount=session.done_count, status=session.status,
        createdAt=session.created_at.isoformat() if session.created_at else "",
    )


@router.get("/sessions/{session_id}/items", response_model=list[HygieneCheckItemResponse])
def list_check_items(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    items = db.query(HygieneCheckItem).filter(HygieneCheckItem.session_id == session_id).all()
    return [
        HygieneCheckItemResponse(
            id=i.id, sessionId=i.session_id, templateId=i.template_id,
            label=i.label, category=i.category, checked=i.checked,
            memo=i.memo, photoUrl=i.photo_url,
        )
        for i in items
    ]


@router.patch("/check-items/{item_id}", response_model=HygieneCheckItemResponse)
def update_check_item(
    item_id: str,
    body: HygieneCheckItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    item = db.query(HygieneCheckItem).filter(HygieneCheckItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")

    if body.checked is not None:
        item.checked = body.checked
    if body.memo is not None:
        item.memo = body.memo
    if body.photoUrl is not None:
        item.photo_url = body.photoUrl

    db.commit()
    db.refresh(item)

    return HygieneCheckItemResponse(
        id=item.id, sessionId=item.session_id, templateId=item.template_id,
        label=item.label, category=item.category, checked=item.checked,
        memo=item.memo, photoUrl=item.photo_url,
    )
