"""
main.py — FastAPI application entry point
SIH 26067 | Ocean Intelligence Platform Backend

Start with:
    uvicorn app.main:app --reload --port 8000

Interactive docs: http://localhost:8000/docs
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_DESCRIPTION, API_TITLE, API_VERSION, CORS_ORIGINS
from app.routers import ai_router, aqua_vis, comparison, datasets, health, ocean, observations
from app.services.netcdf_service import get_netcdf_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    """
    Open datasets on startup, close them on shutdown.
    Keeps xarray file handles alive for the duration of the server process.
    """
    logger.info("Starting SIH 26067 Ocean Backend v%s", API_VERSION)
    svc = get_netcdf_service()
    # Pre-open the demo dataset so the first request is fast
    try:
        ds_ids = svc.list_dataset_ids()
        for ds_id in ds_ids:
            if svc.dataset_exists(ds_id):
                svc.get_dataset(ds_id)
                logger.info("Pre-loaded dataset: %s", ds_id)
            else:
                logger.warning("Dataset '%s' file not found — will serve 404", ds_id)
    except Exception as exc:
        logger.error("Dataset pre-load failed: %s", exc)

    yield  # Server is running

    logger.info("Shutting down — closing datasets")
    svc.close_all()


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(health.router,       prefix=API_PREFIX)
app.include_router(datasets.router,     prefix=API_PREFIX)
app.include_router(ocean.router,        prefix=API_PREFIX)
app.include_router(observations.router, prefix=API_PREFIX)
app.include_router(comparison.router,   prefix=API_PREFIX)
app.include_router(ai_router.router,        prefix=API_PREFIX)
app.include_router(ai_router.direct_router, prefix=API_PREFIX)
app.include_router(aqua_vis.router,        prefix="/api")



# ── Root redirect ──────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "SIH 26067 Ocean Intelligence Platform",
        "version": API_VERSION,
        "docs": "/docs",
        "health": f"{API_PREFIX}/health",
    }
