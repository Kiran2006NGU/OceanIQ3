"""
routers/ocean.py — Ocean data endpoints with multi-dataset provider support
SIH 26067 | Ocean Intelligence Platform Backend

GET /api/v1/ocean/datasets
GET /api/v1/ocean/datasets/{dataset_id}
GET /api/v1/ocean/variables
GET /api/v1/ocean/times
GET /api/v1/ocean/depths
GET /api/v1/ocean/field
GET /api/v1/ocean/value
GET /api/v1/ocean/profile
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.ocean import (
    DatasetDetail,
    DatasetInfo,
    DepthsResponse,
    OceanFieldResponse,
    OceanProfileResponse,
    OceanValueResponse,
    TimesResponse,
    VariableInfo,
)
from app.services.dataset_registry import DatasetRegistry, get_dataset_registry
from app.services.ocean_service import OceanService
from app.utils.netcdf_utils import (
    parse_bbox,
    validate_depth,
    validate_lat,
    validate_lon,
    validate_variable,
)

router = APIRouter(prefix="/ocean", tags=["Ocean Data"])

# Default dataset used when dataset_id is not specified
DEFAULT_DATASET = "demo-ocean"

# Known valid variable IDs (frontend names)
VALID_VARIABLES = {
    "temperature",
    "salinity",
    "chlorophyll",
    "current_u",
    "current_v",
    "current_w",
    "current_velocity",
    "velocity",
    "sea_level",
    "sea_surface_height",
    "ssh",
    "oxygen",
    "phytoplankton",
}


def get_ocean_service(
    registry: DatasetRegistry = Depends(get_dataset_registry),
) -> OceanService:
    return OceanService(registry=registry)


# ── Datasets Catalogue ─────────────────────────────────────────────────────────

@router.get("/datasets", response_model=list[DatasetInfo])
async def list_datasets(
    svc: OceanService = Depends(get_ocean_service),
) -> list[DatasetInfo]:
    """Return catalogue of all registered real & demo ocean datasets."""
    return svc.get_dataset_list()


@router.get("/datasets/{dataset_id}", response_model=DatasetDetail)
async def get_dataset_detail(
    dataset_id: str,
    svc: OceanService = Depends(get_ocean_service),
) -> DatasetDetail:
    """Return full CF metadata manifest for a specific dataset."""
    try:
        return svc.get_dataset_detail(dataset_id)
    except Exception as err:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found: {err}")


# ── Variables ──────────────────────────────────────────────────────────────────

@router.get("/variables", response_model=list[VariableInfo])
async def get_variables(
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset ID to inspect"),
    svc: OceanService = Depends(get_ocean_service),
) -> list[VariableInfo]:
    """Return metadata for all supported ocean variables for the dataset."""
    return svc.get_variables(dataset_id)


# ── Times ──────────────────────────────────────────────────────────────────────

@router.get("/times", response_model=TimesResponse)
async def get_times(
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset identifier"),
    svc: OceanService = Depends(get_ocean_service),
) -> TimesResponse:
    """Return available temporal forecast / analysis timestamps."""
    return svc.get_times(dataset_id)


# ── Depths ─────────────────────────────────────────────────────────────────────

@router.get("/depths", response_model=DepthsResponse)
async def get_depths(
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset identifier"),
    svc: OceanService = Depends(get_ocean_service),
) -> DepthsResponse:
    """Return available vertical depth levels in metres."""
    return svc.get_depths(dataset_id)


# ── Field (2-D Slice) ──────────────────────────────────────────────────────────

@router.get("/field", response_model=OceanFieldResponse)
async def get_field(
    variable: str = Query(..., description="Variable ID (e.g. temperature, salinity)"),
    depth: float = Query(0.0, description="Depth in metres"),
    time: Optional[str] = Query(None, description="ISO 8601 timestamp string"),
    bbox: Optional[str] = Query(None, description="Bounding box: minLat,minLon,maxLat,maxLon"),
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset identifier"),
    svc: OceanService = Depends(get_ocean_service),
) -> OceanFieldResponse:
    """Extract a 2-D spatial field slice at the requested depth and time."""
    validate_variable(variable, VALID_VARIABLES)
    validate_depth(depth)
    parsed_bbox = parse_bbox(bbox)

    try:
        return svc.get_ocean_field(
            dataset_id=dataset_id,
            variable=variable,
            depth=depth,
            time_iso=time,
            bbox=parsed_bbox,
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Failed to extract field: {err}")


# ── Single Point Value Query ───────────────────────────────────────────────────

@router.get("/value", response_model=OceanValueResponse)
async def get_value(
    variable: str = Query(..., description="Variable ID"),
    latitude: float = Query(..., description="Latitude (-90 to 90)"),
    longitude: float = Query(..., description="Longitude (-180 to 180 or 0 to 360)"),
    depth: float = Query(0.0, description="Depth in metres"),
    time: Optional[str] = Query(None, description="ISO 8601 timestamp"),
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset identifier"),
    svc: OceanService = Depends(get_ocean_service),
) -> OceanValueResponse:
    """Query a single nearest-grid-node value with provenance metadata."""
    validate_variable(variable, VALID_VARIABLES)
    validate_lat(latitude)
    validate_lon(longitude)
    validate_depth(depth)

    try:
        return svc.get_point_value(
            dataset_id=dataset_id,
            variable=variable,
            lat=latitude,
            lon=longitude,
            depth=depth,
            time_iso=time,
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Failed to query value: {err}")


# ── Depth Profile ──────────────────────────────────────────────────────────────

@router.get("/profile", response_model=OceanProfileResponse)
async def get_profile(
    variable: str = Query(..., description="Variable ID"),
    latitude: float = Query(..., description="Latitude (-90 to 90)"),
    longitude: float = Query(..., description="Longitude (-180 to 180 or 0 to 360)"),
    time: Optional[str] = Query(None, description="ISO 8601 timestamp"),
    dataset_id: str = Query(DEFAULT_DATASET, description="Dataset identifier"),
    svc: OceanService = Depends(get_ocean_service),
) -> OceanProfileResponse:
    """Extract vertical water-column profile at given coordinates."""
    validate_variable(variable, VALID_VARIABLES)
    validate_lat(latitude)
    validate_lon(longitude)

    try:
        return svc.get_profile(
            dataset_id=dataset_id,
            variable=variable,
            lat=latitude,
            lon=longitude,
            time_iso=time,
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Failed to extract profile: {err}")
