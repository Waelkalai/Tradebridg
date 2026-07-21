import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UserRole(str, enum.Enum):
    SELLER = "seller"
    SUPPLIER = "supplier"
    AGENT = "agent"
    MANAGER = "manager"
    ADMIN = "admin"


ROLE_PREFIX = {
    UserRole.SELLER: "S",
    UserRole.SUPPLIER: "P",
    UserRole.AGENT: "A",
    UserRole.MANAGER: "M",
    UserRole.ADMIN: "D",
}


class AccountStatus(str, enum.Enum):
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    BANNED = "banned"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(6), unique=True, index=True, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus, name="account_status"),
        nullable=False,
        default=AccountStatus.PENDING_REVIEW,
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)

    cin_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cin_photo_front_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cin_photo_back_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fiscal_number: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Supplier-only, per registration form (free-text depot for now, no Agency FK yet)
    primary_depot_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    primary_depot_address: Mapped[str | None] = mapped_column(String(512), nullable=True)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
