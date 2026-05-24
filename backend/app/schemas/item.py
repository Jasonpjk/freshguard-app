from pydantic import BaseModel
from typing import Optional
from datetime import date


class ItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    receivedDate: str
    openedDate: Optional[str] = None
    expiryDate: str
    openedShelfLifeDays: Optional[int] = None
    useAfterOpenDays: Optional[int] = None
    location: Optional[str] = None
    quantity: float = 0
    unit: str = ""
    stockStatus: str = "unopened"
    assignee: Optional[str] = None
    qrLabelEnabled: bool = False
    memo: Optional[str] = None
    cost: float = 0
    storeId: str
    organizationId: str


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    receivedDate: Optional[str] = None
    openedDate: Optional[str] = None
    expiryDate: Optional[str] = None
    openedShelfLifeDays: Optional[int] = None
    useAfterOpenDays: Optional[int] = None
    location: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    stockStatus: Optional[str] = None
    assignee: Optional[str] = None
    qrLabelEnabled: Optional[bool] = None
    memo: Optional[str] = None
    cost: Optional[float] = None


class ItemResponse(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    receivedDate: str
    openedDate: Optional[str] = None
    expiryDate: str
    openedShelfLifeDays: Optional[int] = None
    useAfterOpenDays: Optional[int] = None
    location: Optional[str] = None
    quantity: float
    unit: str
    status: str
    stockStatus: str
    assignee: Optional[str] = None
    qrLabelEnabled: bool = False
    memo: Optional[str] = None
    cost: float
    storeId: str
    organizationId: str
