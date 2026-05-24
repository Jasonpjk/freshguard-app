import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User, StoreMember
from ...models.item import Item
from ...models.stock_log import StockLog
from ...models.disposal_record import DisposalRecord
from ...schemas.item import ItemCreate, ItemUpdate, ItemResponse
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/items", tags=["items"])


def _compute_status(expiry_date: date) -> str:
    today = date.today()
    delta = (expiry_date - today).days
    if delta < 0:
        return "expired"
    if delta <= 1:
        return "urgent"
    if delta <= 3:
        return "warning"
    return "normal"


def _item_to_response(item: Item) -> ItemResponse:
    return ItemResponse(
        id=item.id,
        name=item.name,
        category=item.category,
        receivedDate=str(item.received_date),
        openedDate=str(item.opened_date) if item.opened_date else None,
        expiryDate=str(item.expiry_date),
        openedShelfLifeDays=item.opened_shelf_life_days,
        useAfterOpenDays=item.use_after_open_days,
        location=item.location,
        quantity=float(item.quantity),
        unit=item.unit,
        status=_compute_status(item.expiry_date),
        stockStatus=item.stock_status,
        assignee=item.assignee,
        qrLabelEnabled=item.qr_label_enabled,
        memo=item.memo,
        cost=float(item.cost),
        storeId=item.store_id,
        organizationId=item.organization_id,
    )


def _assert_store_access(user: User, store_id: str, db: Session):
    if user.role in ("owner", "hq_admin"):
        return
    member = db.query(StoreMember).filter(
        StoreMember.user_id == user.id,
        StoreMember.store_id == store_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="해당 매장에 접근 권한이 없습니다.")


@router.get("", response_model=list[ItemResponse])
def list_items(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    _assert_store_access(current_user, storeId, db)
    items = db.query(Item).filter(Item.store_id == storeId).order_by(Item.created_at.desc()).all()
    return [_item_to_response(i) for i in items]


@router.post("", response_model=ItemResponse, status_code=201)
def create_item(
    body: ItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    _assert_store_access(current_user, body.storeId, db)
    expiry = date.fromisoformat(body.expiryDate)
    item = Item(
        id=str(uuid.uuid4()),
        organization_id=body.organizationId,
        store_id=body.storeId,
        name=body.name,
        category=body.category,
        received_date=date.fromisoformat(body.receivedDate),
        opened_date=date.fromisoformat(body.openedDate) if body.openedDate else None,
        expiry_date=expiry,
        opened_shelf_life_days=body.openedShelfLifeDays,
        use_after_open_days=body.useAfterOpenDays,
        location=body.location,
        quantity=body.quantity,
        unit=body.unit,
        status=_compute_status(expiry),
        stock_status=body.stockStatus,
        assignee=body.assignee,
        qr_label_enabled=body.qrLabelEnabled,
        memo=body.memo,
        cost=body.cost,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _item_to_response(item)


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: str,
    body: ItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    _assert_store_access(current_user, item.store_id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        snake = _camel_to_snake(field)
        if hasattr(item, snake):
            if snake in ("received_date", "opened_date", "expiry_date") and value:
                value = date.fromisoformat(value)
            elif snake in ("received_date", "opened_date", "expiry_date") and value is None:
                pass
            setattr(item, snake, value)

    if body.expiryDate:
        item.status = _compute_status(item.expiry_date)

    item.updated_by = current_user.id
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _item_to_response(item)


@router.patch("/{item_id}/stock-status", response_model=ItemResponse)
def update_stock_status(
    item_id: str,
    body: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    _assert_store_access(current_user, item.store_id, db)

    if "stockStatus" in body:
        item.stock_status = body["stockStatus"]
    for field in ("openedDate", "expiryDate", "quantity"):
        if field in body and body[field] is not None:
            snake = _camel_to_snake(field)
            val = body[field]
            if snake in ("opened_date", "expiry_date"):
                val = date.fromisoformat(val)
            setattr(item, snake, val)

    if item.expiry_date:
        item.status = _compute_status(item.expiry_date)

    item.updated_by = current_user.id
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return _item_to_response(item)


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="품목을 찾을 수 없습니다.")
    _assert_store_access(current_user, item.store_id, db)
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    db.delete(item)
    db.commit()
    return None


def _camel_to_snake(name: str) -> str:
    import re
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()
