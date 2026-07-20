"""User-related Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegisterRequest(BaseModel):
    """Registration payload for Seller (S) or Supplier (P)."""

    role: Literal["S", "P"] = Field(
        ...,
        description="Only Sellers and Suppliers can self-register",
    )
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    cin_number: str = Field(
        ...,
        min_length=8,
        max_length=8,
        pattern=r"^\d{8}$",
        description="Tunisian CIN — exactly 8 digits",
    )
    cin_front_url: str = Field(..., min_length=1, max_length=512)
    cin_back_url: str = Field(..., min_length=1, max_length=512)
    company_name: str = Field(..., min_length=1, max_length=255)
    patente_fiscal_number: str | None = Field(
        default=None,
        max_length=64,
        description="Optional fiscal number (Patente). If absent, commission goes to agent.",
    )

    @field_validator("patente_fiscal_number")
    @classmethod
    def empty_patente_to_none(cls, value: str | None) -> str | None:
        """Treat blank Patente values as null."""
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("company_name")
    @classmethod
    def strip_company_name(cls, value: str) -> str:
        """Normalize company name whitespace."""
        stripped = value.strip()
        if not stripped:
            raise ValueError("company_name must not be blank")
        return stripped


class UserResponse(BaseModel):
    """Public user representation (no password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    role: Literal["S", "P", "A", "M", "D"]
    email: EmailStr
    company_name: str
    cin_number: str
    patente_fiscal_number: str | None
    wallet_balance: Decimal
    retour_balance: Decimal
    is_active: bool
    created_at: datetime
