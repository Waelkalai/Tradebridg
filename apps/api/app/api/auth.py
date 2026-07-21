import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.usernames import generate_username
from app.models.otp import OtpCode
from app.models.user import AccountStatus, User, UserRole
from app.schemas.auth import (
    DevActivateRequest,
    LoginRequest,
    OtpRequestRequest,
    OtpRequestResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    RegisterResponse,
    SellerRegisterRequest,
    SupplierRegisterRequest,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


async def _ensure_email_free(db: AsyncSession, email: str) -> None:
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")


@router.post("/register/seller", response_model=RegisterResponse, status_code=201)
async def register_seller(payload: SellerRegisterRequest, db: AsyncSession = Depends(get_db)):
    await _ensure_email_free(db, payload.email)
    username = await generate_username(db, UserRole.SELLER)
    user = User(
        username=username,
        role=UserRole.SELLER,
        status=AccountStatus.PENDING_REVIEW,
        full_name=payload.full_name,
        cin_number=payload.cin_number,
        email=payload.email,
        phone=payload.phone,
        company_name=payload.company_name,
        fiscal_number=payload.fiscal_number,
        cin_photo_front_url=payload.cin_photo_front_url,
        cin_photo_back_url=payload.cin_photo_back_url,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return RegisterResponse(
        user=UserPublic.model_validate(user),
        message="Registration received. Your account is pending review by our team.",
    )


@router.post("/register/supplier", response_model=RegisterResponse, status_code=201)
async def register_supplier(payload: SupplierRegisterRequest, db: AsyncSession = Depends(get_db)):
    await _ensure_email_free(db, payload.email)
    username = await generate_username(db, UserRole.SUPPLIER)
    user = User(
        username=username,
        role=UserRole.SUPPLIER,
        status=AccountStatus.PENDING_REVIEW,
        full_name=payload.full_name,
        cin_number=payload.cin_number,
        email=payload.email,
        phone=payload.phone,
        company_name=payload.company_name,
        fiscal_number=payload.fiscal_number,
        cin_photo_front_url=payload.cin_photo_front_url,
        cin_photo_back_url=payload.cin_photo_back_url,
        primary_depot_name=payload.primary_depot_name,
        primary_depot_address=payload.primary_depot_address,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return RegisterResponse(
        user=UserPublic.model_validate(user),
        message="Registration received. Your account is pending review by our team.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(
        select(User).where(
            or_(User.username == payload.username_or_email, User.email == payload.username_or_email)
        )
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is '{user.status.value}', not active yet",
        )
    token = create_access_token(str(user.id), {"role": user.role.value, "username": user.username})
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)


# --- OTP (dev-mode: no real SMS provider configured yet) ---
# TODO: swap for a real SMS gateway (e.g. Twilio / a local Tunisian SMS
# provider) once credentials are available as a secret. For now the code is
# logged to the server console and, in development only, echoed back in the
# API response so the flow is testable end-to-end without a real provider.

OTP_TTL_SECONDS = 5 * 60


@router.post("/otp/request/{username_or_email}", response_model=OtpRequestResponse)
async def otp_request_for_user(
    username_or_email: str,
    payload: OtpRequestRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(
        select(User).where(or_(User.username == username_or_email, User.email == username_or_email))
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = f"{random.randint(0, 999999):06d}"
    otp = OtpCode(
        user_id=user.id,
        purpose=payload.purpose,
        code_hash=hash_password(code),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
    )
    db.add(otp)
    await db.commit()

    print(f"[DEV OTP] user={user.username} purpose={payload.purpose} code={code}")

    return OtpRequestResponse(
        message="OTP sent (dev mode: logged to server console).",
        expires_in_seconds=OTP_TTL_SECONDS,
        dev_code=code if settings.is_dev else None,
    )


@router.post("/otp/verify/{username_or_email}", response_model=OtpVerifyResponse)
async def otp_verify(
    username_or_email: str,
    payload: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(
        select(User).where(or_(User.username == username_or_email, User.email == username_or_email))
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = await db.scalar(
        select(OtpCode)
        .where(
            OtpCode.user_id == user.id,
            OtpCode.purpose == payload.purpose,
            OtpCode.consumed.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
    )
    if not otp:
        return OtpVerifyResponse(verified=False, message="No pending OTP for this user/purpose.")

    if otp.expires_at < datetime.now(timezone.utc):
        return OtpVerifyResponse(verified=False, message="OTP expired, please request a new one.")

    if otp.attempts >= 3:
        return OtpVerifyResponse(verified=False, message="Too many attempts, please request a new OTP.")

    otp.attempts += 1
    if not verify_password(payload.code, otp.code_hash):
        await db.commit()
        return OtpVerifyResponse(verified=False, message="Incorrect code.")

    otp.consumed = True
    await db.commit()
    return OtpVerifyResponse(verified=True, message="OTP verified.")


# --- Dev-only helper: no agent-activation UI exists yet (that's Phase 2+),
# so this lets us activate a seeded/registered account for local testing. ---
@router.post("/dev/force-activate", response_model=UserPublic)
async def dev_force_activate(payload: DevActivateRequest, db: AsyncSession = Depends(get_db)):
    if not settings.is_dev:
        raise HTTPException(status_code=404, detail="Not found")
    user = await db.scalar(
        select(User).where(
            or_(User.username == payload.username_or_email, User.email == payload.username_or_email)
        )
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = AccountStatus.ACTIVE
    await db.commit()
    await db.refresh(user)
    return UserPublic.model_validate(user)
