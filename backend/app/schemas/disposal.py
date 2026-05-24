from pydantic import BaseModel
from typing import Optional


class DisposalRecordCreate(BaseModel):
    itemName: str
    quantity: float = 0
    unit: str = ""
    reason: Optional[str] = None
    loss: float = 0
    handler: Optional[str] = None
    status: str = "pending"
    storeId: str
    organizationId: str


class DisposalRecordUpdate(BaseModel):
    status: Optional[str] = None
    approver: Optional[str] = None
    reason: Optional[str] = None
    loss: Optional[float] = None


class DisposalRecordResponse(BaseModel):
    id: str
    date: str
    itemName: str
    quantity: float
    unit: str
    reason: Optional[str] = None
    loss: float
    handler: Optional[str] = None
    approver: Optional[str] = None
    status: str
    storeId: Optional[str] = None
    organizationId: Optional[str] = None
