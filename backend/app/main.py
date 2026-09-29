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



# ── Static Files (Production Frontend Bundle) ───────────────────────────────────

from pathlib import Path
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

DIST_DIR = Path(__file__).resolve().parent.parent.parent / "dist"
if not DIST_DIR.exists():
    DIST_DIR = Path("/app/dist")

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(DIST_DIR / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith(("api/", "api", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "service": "SIH 26067 Ocean Intelligence Platform",
            "version": API_VERSION,
            "docs": "/docs",
            "health": f"{API_PREFIX}/health",
        }
