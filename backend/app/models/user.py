"""User ORM model and role enumeration."""

from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.agency import Agency


class UserRole(str, enum.Enum):
    """Platform roles — username prefix matches the value."""

    SELLER = "S"
    SUPPLIER = "P"
    AGENT = "A"
    MANAGER = "M"
    ADMIN = "D"


class User(Base):
    """Core identity model for all Tradebridg actors."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    username: Mapped[str] = mapped_column(
        String(5),
        unique=True,
        nullable=False,
        index=True,
        comment="Auto-generated: role prefix + 4 digits (e.g. S8492)",
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    cin_number: Mapped[str] = mapped_column(String(8), unique=True, nullable=False)
    cin_front_url: Mapped[str] = mapped_column(String(512), nullable=False)
    cin_back_url: Mapped[str] = mapped_column(String(512), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    patente_fiscal_number: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        unique=True,
        comment="If null, 3% commission goes to delivery agent",
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    wallet_balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 3),
        nullable=False,
        default=Decimal("0.000"),
        server_default="0.000",
    )
    retour_balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 3),
        nullable=False,
        default=Decimal("0.000"),
        server_default="0.000",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    managed_agencies: Mapped[list[Agency]] = relationship(
        "Agency",
        back_populates="manager",
        foreign_keys="Agency.manager_id",
    )

    def __repr__(self) -> str:
        return f"<User username={self.username!r} role={self.role.value!r}>"
