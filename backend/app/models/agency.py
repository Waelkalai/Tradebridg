"""Agency ORM model."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Agency(Base):
    """Physical agency / depot managed by a Manager user."""

    __tablename__ = "agencies"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    location: Mapped[str] = mapped_column(String(512), nullable=False)
    manager_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    manager: Mapped[User] = relationship(
        "User",
        back_populates="managed_agencies",
        foreign_keys=[manager_id],
    )

    def __repr__(self) -> str:
        return f"<Agency name={self.name!r} location={self.location!r}>"
