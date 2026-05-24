from pydantic import BaseModel, EmailStr
from typing import Optional


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organizationId: Optional[str] = None
    isActive: bool = True


class StaffMemberResponse(BaseModel):
    id: str
    name: str
    role: str
    phone: Optional[str] = None
    store: Optional[str] = None
    email: str = ""
    lastActive: Optional[str] = None
    status: str = "active"


class StaffInviteRequest(BaseModel):
    email: EmailStr
    storeId: str
    role: str = "staff"


class StaffUpdateRequest(BaseModel):
    storeId: str
    role: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
