from pydantic import BaseModel, EmailStr
from typing import Optional, List


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    orgType: str = "individual"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OrgResponse(BaseModel):
    id: str
    name: str
    type: str
    ownerId: Optional[str] = None
    createdAt: str


class StoreResponse(BaseModel):
    id: str
    organizationId: str
    name: str
    address: str = ""
    type: str = "restaurant"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organizationId: str
    storeIds: List[str]


class TokenResponse(BaseModel):
    accessToken: str
    user: UserResponse
    org: Optional[OrgResponse]
    stores: List[StoreResponse]
    needsOnboarding: bool = False


class MeResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organizationId: str
    storeIds: List[str]
    org: Optional[OrgResponse]
    stores: List[StoreResponse]


class OnboardingRequest(BaseModel):
    organizationId: str
    storeId: str
    orgName: str
    storeName: str
    businessType: str


class PasswordResetRequest(BaseModel):
    email: EmailStr
