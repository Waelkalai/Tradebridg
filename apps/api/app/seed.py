"""Dev seed script: creates one active demo user per role for local testing.

Usage:
    source .venv/bin/activate && python -m app.seed
"""

import asyncio

from sqlalchemy import select

from app.core.db import AsyncSessionLocal
from app.core.security import hash_password
from app.core.usernames import generate_username
from app.models.user import AccountStatus, User, UserRole

DEMO_PASSWORD = "Demo@12345"

DEMO_USERS = [
    {
        "role": UserRole.ADMIN,
        "full_name": "Admin Démo",
        "email": "admin@demo.tradebridge.tn",
        "phone": "+21620000001",
    },
    {
        "role": UserRole.MANAGER,
        "full_name": "Manager Tunis-A03",
        "email": "manager@demo.tradebridge.tn",
        "phone": "+21620000002",
    },
    {
        "role": UserRole.AGENT,
        "full_name": "Agent Support",
        "email": "agent@demo.tradebridge.tn",
        "phone": "+21620000003",
    },
    {
        "role": UserRole.SELLER,
        "full_name": "Ahmed Seller",
        "email": "seller@demo.tradebridge.tn",
        "phone": "+21620000004",
        "company_name": "Ahmed Store",
    },
    {
        "role": UserRole.SUPPLIER,
        "full_name": "Fatma Supplier",
        "email": "supplier@demo.tradebridge.tn",
        "phone": "+21620000005",
        "company_name": "Fatma Import-Export",
        "primary_depot_name": "Depot Ariana Principal",
        "primary_depot_address": "Zone Industrielle, Ariana, Tunisie",
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        created = []
        for spec in DEMO_USERS:
            existing = await db.scalar(select(User).where(User.email == spec["email"]))
            if existing:
                print(f"[seed] already exists: {existing.username} ({existing.email})")
                created.append(existing)
                continue

            username = await generate_username(db, spec["role"])
            user = User(
                username=username,
                role=spec["role"],
                status=AccountStatus.ACTIVE,
                full_name=spec["full_name"],
                email=spec["email"],
                phone=spec["phone"],
                company_name=spec.get("company_name"),
                primary_depot_name=spec.get("primary_depot_name"),
                primary_depot_address=spec.get("primary_depot_address"),
                cin_number="00000000",
                password_hash=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            created.append(user)
            print(f"[seed] created: {user.username} ({user.role.value}) <{user.email}>")

        print("\n=== TradeBridge demo credentials ===")
        for user in created:
            print(f"  role={user.role.value:<9} username={user.username:<6} "
                  f"email={user.email:<32} password={DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
