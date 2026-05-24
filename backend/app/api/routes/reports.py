from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User
from ...models.item import Item
from ...models.disposal_record import DisposalRecord
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
def reports_summary(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    today = date.today()

    status_counts = (
        db.query(Item.status, func.count(Item.id))
        .filter(Item.store_id == storeId)
        .group_by(Item.status)
        .all()
    )
    status_map = {s: c for s, c in status_counts}

    first_day = today.replace(day=1)
    monthly_loss = db.query(func.sum(DisposalRecord.loss_amount)).filter(
        DisposalRecord.store_id == storeId,
        DisposalRecord.created_at >= first_day,
    ).scalar() or 0

    priority_items = db.query(Item).filter(
        Item.store_id == storeId,
        Item.status.in_(["expired", "urgent", "warning"]),
    ).order_by(Item.expiry_date).limit(5).all()

    return {
        "statusCounts": {
            "expired": status_map.get("expired", 0),
            "urgent": status_map.get("urgent", 0),
            "warning": status_map.get("warning", 0),
            "normal": status_map.get("normal", 0),
        },
        "monthlyLoss": float(monthly_loss),
        "priorityItems": [
            {
                "id": i.id,
                "name": i.name,
                "expiryDate": str(i.expiry_date),
                "status": i.status,
                "quantity": float(i.quantity),
                "unit": i.unit,
            }
            for i in priority_items
        ],
    }


@router.get("/disposal-trends")
def disposal_trends(
    storeId: str = Query(...),
    months: int = Query(6, ge=1, le=12),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    from dateutil.relativedelta import relativedelta  # type: ignore

    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        month_start = (today.replace(day=1) - relativedelta(months=i))
        month_end = (month_start + relativedelta(months=1))
        total = db.query(func.sum(DisposalRecord.loss_amount)).filter(
            DisposalRecord.store_id == storeId,
            DisposalRecord.created_at >= month_start,
            DisposalRecord.created_at < month_end,
        ).scalar() or 0
        result.append({"month": month_start.strftime("%Y-%m"), "loss": float(total)})

    return result


@router.get("/category-distribution")
def category_distribution(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Item.category, func.count(Item.id))
        .filter(Item.store_id == storeId)
        .group_by(Item.category)
        .all()
    )
    return [{"category": cat or "기타", "count": cnt} for cat, cnt in rows]
