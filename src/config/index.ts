/**
 * Ocean Intelligence Platform — Centralized Configuration
 * SIH 26067 | INCOIS / MoES
 */

import type { DataFormat, ObservationTypeConfig, OceanVariableConfig } from '@/types/ocean'

// ─── API Configuration ────────────────────────────────────────────────────────

export const API_CONFIG = {
  /** Base URL for the FastAPI backend (to be set in .env) */
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  version: 'v1',
  timeout: 2500, // ms — fast fallback if backend is unreachable
} as const

export const API_ENDPOINTS = {
  datasets: '/api/v1/datasets',
  observations: '/api/v1/observations',
  variables: '/api/v1/variables',
  timeseries: '/api/v1/timeseries',
  profile: '/api/v1/profile',
  health: '/api/v1/health',
} as const

// ─── Supported Ocean Variables ────────────────────────────────────────────────

export const OCEAN_VARIABLES: OceanVariableConfig[] = [
  {
    id: 'temperature',
    label: 'Sea Surface Temperature',
    unit: '°C',
    colormap: 'thermal',
    minValue: -2,
    maxValue: 34,
    description: 'Ocean water temperature at specified depth',
  },
  {
    id: 'salinity',
    label: 'Salinity',
    unit: 'PSU',
    colormap: 'haline',
    minValue: 30,
    maxValue: 40,
    description: 'Practical salinity unit — dissolved salt concentration',
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll-a',
    unit: 'mg m⁻³',
    colormap: 'algae',
    minValue: 0,
    maxValue: 30,
    description: 'Chlorophyll-a concentration — proxy for phytoplankton biomass',
  },
  {
    id: 'current_u',
    label: 'Eastward Current (U)',
    unit: 'm/s',
    colormap: 'curl',
    minValue: -2,
    maxValue: 2,
    description: 'Zonal (eastward) component of ocean current velocity',
  },
  {
    id: 'current_v',
    label: 'Northward Current (V)',
    unit: 'm/s',
    colormap: 'curl',
    minValue: -2,
    maxValue: 2,
    description: 'Meridional (northward) component of ocean current velocity',
  },
  {
    id: 'current_w',
    label: 'Vertical Current (W)',
    unit: 'm/s',
    colormap: 'curl',
    minValue: -0.1,
    maxValue: 0.1,
    description: 'Vertical (upward) component of ocean current velocity',
  },
]

// ─── Supported Observation Types ──────────────────────────────────────────────

export const OBSERVATION_TYPES: ObservationTypeConfig[] = [
  {
    id: 'argo',
    label: 'Argo Float',
    description: 'Autonomous profiling floats measuring T/S from surface to 2000 m',
    icon: 'circle',
    color: '#00b4d8',
  },
  {
    id: 'glider',
    label: 'Ocean Glider',
    description: 'Autonomous underwater vehicle — high-resolution transects',
    icon: 'triangle',
    color: '#22d3a0',
  },
  {
    id: 'ctd',
    label: 'CTD Cast',
    description: 'Ship-based conductivity, temperature, and depth measurement',
    icon: 'square',
    color: '#f59e0b',
  },
  {
    id: 'bgc',
    label: 'BGC-Argo',
    description: 'Biogeochemical Argo float — includes O₂, NO₃, Chl-a, BBP, pH',
    icon: 'hexagon',
    color: '#a78bfa',
  },
  {
    id: 'adcp',
    label: 'ADCP',
    description: 'Acoustic Doppler Current Profiler — current velocity profiles',
    icon: 'arrow-up',
    color: '#f87171',
  },
]

// ─── Supported Data Formats ───────────────────────────────────────────────────

export const SUPPORTED_FORMATS: DataFormat[] = ['netcdf', 'csv', 'json', 'hdf5', 'grib2']

// ─── Domain bounds (Indian Ocean / Bay of Bengal focus) ──────────────────────

export const DEFAULT_SPATIAL_BOUNDS = {
  minLat: -30,
  maxLat: 30,
  minLon: 40,
  maxLon: 100,
} as const

export const BAY_OF_BENGAL_BOUNDS = {
  minLat: 5,
  maxLat: 22,
  minLon: 80,
  maxLon: 100,
} as const

export const ARABIAN_SEA_BOUNDS = {
  minLat: 5,
  maxLat: 25,
  minLon: 55,
  maxLon: 78,
} as const

// ─── Standard depth levels ────────────────────────────────────────────────────

export const STANDARD_DEPTHS = [0, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000] as const

// ─── UI / App config ──────────────────────────────────────────────────────────

export const APP_CONFIG = {
  name: 'Ocean Intelligence Platform',
  shortName: 'OceanIQ',
  description: 'Interactive 3D visualization of numerical ocean model outputs and in-situ observations',
  version: '0.1.0',
  buildId: 'INCOIS-OIQ',
} as const

export const PRIMARY_NAV_ITEMS = [
  { label: '3D Explorer', path: '/dashboard', icon: 'globe' },
  { label: 'Observations', path: '/observations', icon: 'radio' },
  { label: 'Model Validation', path: '/compare', icon: 'scale' },
  { label: 'Hazards & Ops', path: '/operations', icon: 'shield-alert' },
  { label: 'AI Intelligence', path: '/ai', icon: 'cpu' },
] as const

export const SECONDARY_NAV_ITEMS = [
  { label: 'User Manual & INCOIS Guide', path: '/manual', icon: 'book-open' },
  { label: 'Data Hub', path: '/data', icon: 'database' },
  { label: 'Diagnostics Lab', path: '/analysis', icon: 'activity' },
  { label: 'Data Providers', path: '/providers', icon: 'network' },
  { label: 'Documentation', path: '/science', icon: 'book-open' },
  { label: 'Mission Overview', path: '/', icon: 'compass' },
] as const

export const NAV_ITEMS = PRIMARY_NAV_ITEMS
