import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.user import User
from ...models.storage_location import StorageLocation
from ...schemas.storage_location import StorageLocationCreate, StorageLocationUpdate, StorageLocationResponse
from ...api.deps import get_current_active_user

router = APIRouter(prefix="/storage-locations", tags=["storage_locations"])


def _loc_to_response(loc: StorageLocation) -> StorageLocationResponse:
    return StorageLocationResponse(
        id=loc.id,
        name=loc.name,
        type=loc.type or "dry",
        temperature=float(loc.temperature) if loc.temperature is not None else None,
        capacity=int(loc.capacity) if loc.capacity is not None else 0,
        notes=loc.notes,
    )


@router.get("", response_model=list[StorageLocationResponse])
def list_locations(
    storeId: str = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    locs = db.query(StorageLocation).filter(
        StorageLocation.store_id == storeId
    ).order_by(StorageLocation.name).all()
    return [_loc_to_response(l) for l in locs]


@router.post("", response_model=StorageLocationResponse, status_code=201)
def create_location(
    body: StorageLocationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="보관 위치 생성 권한이 없습니다.")

    loc = StorageLocation(
        id=str(uuid.uuid4()),
        organization_id=body.organizationId,
        store_id=body.storeId,
        name=body.name,
        type=body.type,
        temperature=body.temperature,
        capacity=body.capacity,
        notes=body.notes,
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return _loc_to_response(loc)


@router.patch("/{loc_id}", response_model=StorageLocationResponse)
def update_location(
    loc_id: str,
    body: StorageLocationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="보관 위치 수정 권한이 없습니다.")

    loc = db.query(StorageLocation).filter(StorageLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="보관 위치를 찾을 수 없습니다.")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)

    loc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(loc)
    return _loc_to_response(loc)


@router.delete("/{loc_id}", status_code=204)
def delete_location(
    loc_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("owner", "manager", "hq_admin"):
        raise HTTPException(status_code=403, detail="보관 위치 삭제 권한이 없습니다.")

    loc = db.query(StorageLocation).filter(StorageLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="보관 위치를 찾을 수 없습니다.")

    db.delete(loc)
    db.commit()
    return None
