"""
services/ocean_service.py — Unified Ocean Business Logic Layer
SIH 26067 | Ocean Intelligence Platform Backend

Dispatches all requests to appropriate BaseOceanProvider instances via DatasetRegistry.
Handles dataset switching, real/demo modes, observation queries, and provenance metadata.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.models.ocean import (
    DatasetDetail,
    DatasetInfo,
    DepthsResponse,
    HealthResponse,
    ObservationProfileResponse,
    ObservationResponse,
    OceanFieldResponse,
    OceanProfileResponse,
    OceanValueResponse,
    TimesResponse,
    VariableInfo,
)
from app.services.dataset_registry import DatasetRegistry, get_dataset_registry
from app.services.netcdf_service import NetCDFService
from app.config import API_VERSION

logger = logging.getLogger(__name__)


class OceanService:
    """
    Unified entry point for oceanographic business logic.
    """

    def __init__(
        self,
        netcdf_service: Optional[NetCDFService] = None,
        registry: Optional[DatasetRegistry] = None,
    ):
        self.netcdf_service = netcdf_service
        self.registry = registry or get_dataset_registry()

    # ── Health ─────────────────────────────────────────────────────────────────

    def get_health(self) -> HealthResponse:
        datasets = self.registry.list_datasets()
        real_count = sum(1 for d in datasets if d.is_real_data)
        data_source_mode = f"Multi-Source Provider ({len(datasets)} datasets, {real_count} real INCOIS/Argo)"

        from app.services.anomaly_service import get_moment_service
        from app.services.assistant_service import get_assistant_service
        from app.services.ocean_prediction_service import get_samudra_service

        moment_status = get_moment_service().get_status()
        qwen_status = get_assistant_service().get_status()
        samudra_status = get_samudra_service().get_status()

        return HealthResponse(
            status="ok",
            service="SIH 26067 Ocean Backend",
            version=API_VERSION,
            data_source=data_source_mode,
            models={
                "moment": moment_status,
                "qwen": qwen_status,
                "samudra2": samudra_status,
            },
        )

    # ── Dataset Catalog ────────────────────────────────────────────────────────

    def get_dataset_list(self) -> list[DatasetInfo]:
        return self.registry.list_datasets()

    def get_dataset_detail(self, dataset_id: str = "demo-ocean") -> DatasetDetail:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_dataset_detail()

    # ── Variables ──────────────────────────────────────────────────────────────

    def get_variables(self, dataset_id: str = "demo-ocean") -> list[VariableInfo]:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_variables()

    # ── Times & Depths ─────────────────────────────────────────────────────────

    def get_times(self, dataset_id: str = "demo-ocean") -> TimesResponse:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_times()

    def get_depths(self, dataset_id: str = "demo-ocean") -> DepthsResponse:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_depths()

    # ── Field Slices ───────────────────────────────────────────────────────────

    def get_ocean_field(
        self,
        dataset_id: str,
        variable: str,
        depth: float,
        time_iso: Optional[str] = None,
        bbox: Optional[tuple[float, float, float, float]] = None,
        max_grid_points: int = 2500,
    ) -> OceanFieldResponse:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_field(
            variable=variable,
            depth=depth,
            time_iso=time_iso,
            bbox=bbox,
            max_grid_points=max_grid_points,
        )

    # ── Point Value Query ──────────────────────────────────────────────────────

    def get_point_value(
        self,
        dataset_id: str,
        variable: str,
        lat: float,
        lon: float,
        depth: float,
        time_iso: Optional[str] = None,
    ) -> OceanValueResponse:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_value(
            variable=variable,
            lat=lat,
            lon=lon,
            depth=depth,
            time_iso=time_iso,
        )

    # ── Depth Profile ──────────────────────────────────────────────────────────

    def get_profile(
        self,
        dataset_id: str,
        variable: str,
        lat: float,
        lon: float,
        time_iso: Optional[str] = None,
    ) -> OceanProfileResponse:
        provider = self.registry.get_provider(dataset_id)
        return provider.get_profile(
            variable=variable,
            lat=lat,
            lon=lon,
            time_iso=time_iso,
        )

    # ── Observations ───────────────────────────────────────────────────────────

    def get_observations(
        self,
        platform_type: Optional[str] = None,
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lon: Optional[float] = None,
        is_real_data: Optional[bool] = None,
    ) -> list[ObservationResponse]:
        obs_p = self.registry.get_observation_provider()
        return obs_p.get_observations(
            platform_type=platform_type,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lon=min_lon,
            max_lon=max_lon,
            is_real_data=is_real_data,
        )

    def get_observation_profile(self, observation_id: str) -> ObservationProfileResponse:
        obs_p = self.registry.get_observation_provider()
        return obs_p.get_observation_profile(observation_id)
