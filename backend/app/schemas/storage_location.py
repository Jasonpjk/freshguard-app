from pydantic import BaseModel
from typing import Optional


class StorageLocationCreate(BaseModel):
    name: str
    type: str = "dry"
    temperature: Optional[float] = None
    capacity: int = 0
    notes: Optional[str] = None
    storeId: str
    organizationId: str


class StorageLocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    temperature: Optional[float] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None


class StorageLocationResponse(BaseModel):
    id: str
    name: str
    type: str
    temperature: Optional[float] = None
    capacity: int
    notes: Optional[str] = None
