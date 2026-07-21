import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import ROLE_PREFIX, User, UserRole


async def generate_username(db: AsyncSession, role: UserRole) -> str:
    prefix = ROLE_PREFIX[role]
    for _ in range(50):
        candidate = f"{prefix}{random.randint(0, 9999):04d}"
        existing = await db.scalar(select(User).where(User.username == candidate))
        if not existing:
            return candidate
    raise RuntimeError("Could not generate a unique username after 50 attempts")
