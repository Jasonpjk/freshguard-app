from pydantic import BaseModel
from typing import Optional, List


class HygieneTemplateResponse(BaseModel):
    id: str
    category: Optional[str] = None
    label: str
    required: bool
    sortOrder: int
    storeId: Optional[str] = None


class HygieneSessionCreate(BaseModel):
    storeId: str
    checkerId: Optional[str] = None
    checkedDate: str
    totalCount: int = 0
    doneCount: int = 0
    status: str = "incomplete"
    organizationId: str


class HygieneSessionResponse(BaseModel):
    id: str
    storeId: str
    checkerId: Optional[str] = None
    checkedDate: str
    totalCount: int
    doneCount: int
    status: str
    createdAt: str


class HygieneCheckItemUpdate(BaseModel):
    checked: Optional[bool] = None
    memo: Optional[str] = None
    photoUrl: Optional[str] = None


class HygieneCheckItemResponse(BaseModel):
    id: str
    sessionId: str
    templateId: Optional[str] = None
    label: Optional[str] = None
    category: Optional[str] = None
    checked: bool
    memo: Optional[str] = None
    photoUrl: Optional[str] = None
