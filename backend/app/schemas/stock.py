from pydantic import BaseModel
from typing import Optional


class StockLogCreate(BaseModel):
    type: str  # received | opened | used | disposed
    itemId: Optional[str] = None
    itemName: str = ""
    quantity: float = 0
    unit: str = ""
    handler: Optional[str] = None
    memo: Optional[str] = None
    storeId: str
    organizationId: str


class StockLogResponse(BaseModel):
    id: str
    date: str
    type: str
    itemId: Optional[str] = None
    itemName: str
    quantity: float
    unit: str
    handler: Optional[str] = None
    memo: Optional[str] = None
    storeId: Optional[str] = None
    organizationId: Optional[str] = None
