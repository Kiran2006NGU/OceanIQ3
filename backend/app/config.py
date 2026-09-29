"""
config.py — Application configuration
SIH 26067 | Ocean Intelligence Platform Backend

Reads from environment variables with sensible defaults for local development.
"""

from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────

# Root of the backend/ directory (one level up from app/)
BACKEND_ROOT: Path = Path(__file__).resolve().parent.parent

# Directory where NetCDF files are stored
DATA_DIR: Path = BACKEND_ROOT / "data"

# Demo dataset directory
DEMO_DATA_DIR: Path = DATA_DIR / "demo"

# ── Registered datasets ────────────────────────────────────────────────────────
#
# Each entry maps a dataset_id → relative path inside DATA_DIR.
# Add real INCOIS NetCDF paths here in Phase 4.
#
DATASET_REGISTRY: dict[str, Path] = {
    "demo-ocean": DEMO_DATA_DIR / "demo_ocean.nc",
}

# ── CORS ───────────────────────────────────────────────────────────────────────

# Explicit origins for CORS
import os
import json

_raw_cors = os.getenv("CORS_ORIGINS")
if _raw_cors:
    try:
        CORS_ORIGINS: list[str] = json.loads(_raw_cors) if _raw_cors.strip().startswith("[") else [o.strip() for o in _raw_cors.split(",")]
    except Exception:
        CORS_ORIGINS = ["*"]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",   # Vite dev server (default port)
        "http://127.0.0.1:5173",
        "http://localhost:3000",   # alternate React dev port
        "*",                       # Allow cloud deployments (Render, Vercel, etc.)
    ]

# ── API metadata ───────────────────────────────────────────────────────────────

API_TITLE = "SIH 26067 Ocean Intelligence Platform API"
API_VERSION = "0.3.0"
API_DESCRIPTION = """
## Ocean Intelligence Platform — Phase 3 Backend

Provides ocean model data from NetCDF files via FastAPI + xarray.

**Data pipeline:**  React → FastAPI → xarray → NetCDF

⚠️ **DEMO / SIMULATED DATA** — not affiliated with INCOIS operational forecasts.
"""
