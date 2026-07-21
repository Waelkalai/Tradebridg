import uuid

from pydantic import BaseModel, EmailStr, Field

from app.models.user import AccountStatus, UserRole


class SellerRegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    cin_number: str = Field(min_length=4, max_length=64)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    company_name: str | None = None
    fiscal_number: str | None = None
    cin_photo_front_url: str | None = None
    cin_photo_back_url: str | None = None


class SupplierRegisterRequest(SellerRegisterRequest):
    primary_depot_name: str = Field(min_length=2, max_length=255)
    primary_depot_address: str = Field(min_length=2, max_length=512)


class UserPublic(BaseModel):
    id: uuid.UUID
    username: str
    role: UserRole
    status: AccountStatus
    full_name: str
    email: EmailStr
    phone: str
    company_name: str | None = None
    fiscal_number: str | None = None

    class Config:
        from_attributes = True


class RegisterResponse(BaseModel):
    user: UserPublic
    message: str


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class OtpRequestRequest(BaseModel):
    purpose: str = "login_verify"


class OtpRequestResponse(BaseModel):
    message: str
    expires_in_seconds: int
    dev_code: str | None = None


class OtpVerifyRequest(BaseModel):
    purpose: str = "login_verify"
    code: str


class OtpVerifyResponse(BaseModel):
    verified: bool
    message: str


class DevActivateRequest(BaseModel):
    username_or_email: str
