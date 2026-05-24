import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User
from ...models.disposal_record import DisposalRecord
from ...schemas.disposal import DisposalRecordCreate, DisposalRecordUpdate, DisposalRecordResponse
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/disposal-records", tags=["disposal"])


def _record_to_response(r: DisposalRecord) -> DisposalRecordResponse:
    return DisposalRecordResponse(
        id=r.id,
        date=r.created_at.date().isoformat() if r.created_at else "",
        itemName=r.item_name,
        quantity=float(r.quantity) if r.quantity is not None else 0,
        unit=r.unit or "",
        reason=r.reason,
        loss=float(r.loss_amount),
        handler=r.handler_name,
        approver=r.approver_name,
        status=r.status,
        storeId=r.store_id,
        organizationId=r.organization_id,
    )


@router.get("", response_model=list[DisposalRecordResponse])
def list_disposal_records(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    records = db.query(DisposalRecord).filter(
        DisposalRecord.store_id == storeId
    ).order_by(DisposalRecord.created_at.desc()).all()
    return [_record_to_response(r) for r in records]


@router.post("", response_model=DisposalRecordResponse, status_code=201)
def create_disposal_record(
    body: DisposalRecordCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    record = DisposalRecord(
        id=str(uuid.uuid4()),
        organization_id=body.organizationId,
        store_id=body.storeId,
        item_name=body.itemName,
        quantity=body.quantity,
        unit=body.unit,
        reason=body.reason,
        loss_amount=body.loss,
        handler_id=current_user.id,
        handler_name=current_user.name,
        status=body.status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_to_response(record)


@router.patch("/{record_id}", response_model=DisposalRecordResponse)
def update_disposal_record(
    record_id: str,
    body: DisposalRecordUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    record = db.query(DisposalRecord).filter(DisposalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="폐기 기록을 찾을 수 없습니다.")

    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="승인/거부 권한이 없습니다.")

    if body.status is not None:
        record.status = body.status
    if body.approver is not None:
        record.approver_name = body.approver
        record.approver_id = current_user.id
        record.approved_at = datetime.now(timezone.utc)
    if body.reason is not None:
        record.reason = body.reason
    if body.loss is not None:
        record.loss_amount = body.loss

    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return _record_to_response(record)
