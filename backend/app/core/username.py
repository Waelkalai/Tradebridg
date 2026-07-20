"""Username generation helpers (Prefix + 4 digits)."""

from __future__ import annotations

import secrets

from app.models.user import UserRole

_USERNAME_DIGITS = 4
_MAX_USERNAME_ATTEMPTS = 50


def generate_username(role: UserRole) -> str:
    """
    Generate a candidate username: role prefix + 4 random digits.

    Callers must verify uniqueness against the database and retry if needed.
    """
    suffix = secrets.randbelow(10**_USERNAME_DIGITS)
    return f"{role.value}{suffix:0{_USERNAME_DIGITS}d}"


def generate_unique_username_candidates(
    role: UserRole,
    *,
    count: int = _MAX_USERNAME_ATTEMPTS,
) -> list[str]:
    """Return a list of unique username candidates for a role."""
    candidates: set[str] = set()
    while len(candidates) < count:
        candidates.add(generate_username(role))
    return list(candidates)
