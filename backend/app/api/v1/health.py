"""Health endpoints under /api/v1."""

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def api_health() -> dict[str, str]:
    """Versioned health check for the API v1 surface."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
