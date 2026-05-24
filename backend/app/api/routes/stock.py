import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User
from ...models.stock_log import StockLog
from ...schemas.stock import StockLogCreate, StockLogResponse
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/stock-logs", tags=["stock"])


def _log_to_response(log: StockLog) -> StockLogResponse:
    return StockLogResponse(
        id=log.id,
        date=log.created_at.date().isoformat() if log.created_at else "",
        type=log.action,
        itemId=log.item_id,
        itemName=log.item_name,
        quantity=float(log.quantity) if log.quantity is not None else 0,
        unit=log.unit or "",
        handler=log.actor_id,
        memo=log.note,
        storeId=log.store_id,
        organizationId=log.organization_id,
    )


@router.get("", response_model=list[StockLogResponse])
def list_stock_logs(
    storeId: str = Query(...),
    itemId: str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(StockLog).filter(StockLog.store_id == storeId)
    if itemId:
        query = query.filter(StockLog.item_id == itemId)
    logs = query.order_by(StockLog.created_at.desc()).limit(200).all()
    return [_log_to_response(l) for l in logs]


@router.post("", response_model=StockLogResponse, status_code=201)
def create_stock_log(
    body: StockLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    log = StockLog(
        id=str(uuid.uuid4()),
        organization_id=body.organizationId,
        store_id=body.storeId,
        item_id=body.itemId,
        item_name=body.itemName,
        action=body.type,
        quantity=body.quantity,
        unit=body.unit,
        note=body.memo,
        actor_id=current_user.id,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _log_to_response(log)
