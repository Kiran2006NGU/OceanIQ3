/**
 * samudraService.ts — INCOIS SAMUDRA Real-Time Ocean Data API Client
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * SAMUDRA (https://samudra.incois.gov.in) is INCOIS's operational ocean
 * data portal providing real-time model outputs, satellite observations,
 * and in-situ measurements for the Indian Ocean.
 *
 * API Endpoints:
 * - SST (Sea Surface Temperature) field grids
 * - SSH (Sea Surface Height / Sea Level anomaly)
 * - Current velocity components (U, V)
 * - Chlorophyll-a (from MODIS/VIIRS)
 * - Argo float positions
 * - PFZ (Potential Fishing Zone) advisories
 *
 * Graceful fallback: If API key is missing or request fails,
 * returns high-quality demo data that mirrors real SAMUDRA structure.
 */

import type { OceanVariable } from '@/types/ocean'

// ─── Configuration ────────────────────────────────────────────────────────────

const SAMUDRA_BASE = 'https://samudra.incois.gov.in/api/v1'
const SAMUDRA_API_KEY = import.meta.env.VITE_SAMUDRA_API_KEY as string | undefined

export const isSamudraConfigured = Boolean(SAMUDRA_API_KEY)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SamudraFieldResponse {
  variable: OceanVariable
  depth_m: number
  timestamp: string   // ISO 8601
  latitudes: number[]
  longitudes: number[]
  values: number[][]  // [lat_idx][lon_idx]
  unit: string
  source: 'samudra_live' | 'samudra_demo'
  quality: 'RT' | 'NRT' | 'DT'  // Real-time / Near Real-time / Delayed mode
}

export interface SamudraArgoPosition {
  platform_id: string
  wmo_id: number
  latitude: number
  longitude: number
  last_profile_date: string
  last_depth_m: number
  temperature_at_surface: number
  salinity_at_surface: number
  cycle_number: number
  status: 'active' | 'inactive' | 'grounded'
}

export interface SamudraPFZAdvisory {
  id: string
  date: string
  region: string
  latitude_range: [number, number]
  longitude_range: [number, number]
  confidence: 'high' | 'medium' | 'low'
  expected_fish_species: string[]
  sst_c: number
  chlorophyll_mg_m3: number
}

export interface SamudraSSHPoint {
  latitude: number
  longitude: number
  ssh_anomaly_cm: number  // positive = above mean, negative = below
  absolute_ssh_m: number
  timestamp: string
}

export interface SamudraDatasetInfo {
  id: string
  name: string
  variable: OceanVariable
  source: string
  temporal_coverage: string
  spatial_coverage: string
  resolution: string
  update_frequency: string
  format: string
  is_live: boolean
}

// ─── Dataset Catalog ──────────────────────────────────────────────────────────

export const SAMUDRA_DATASETS: SamudraDatasetInfo[] = [
  {
    id: 'samudra-sst-rt',
    name: 'INCOIS SST (Real-Time, MODIS+VIIRS Merged)',
    variable: 'temperature',
    source: 'SAMUDRA / INCOIS',
    temporal_coverage: 'Daily (last 30 days)',
    spatial_coverage: 'Indian Ocean (0–30°N, 40–100°E)',
    resolution: '4 km',
    update_frequency: 'Daily 06:00 IST',
    format: 'NetCDF-4 / JSON API',
    is_live: true,
  },
  {
    id: 'samudra-ssh-nrt',
    name: 'INCOIS Sea Level Anomaly (ALTIKA+SENTINEL-6)',
    variable: 'sea_level',
    source: 'SAMUDRA / INCOIS / CNES',
    temporal_coverage: 'Daily (5-day latency)',
    spatial_coverage: 'Indian Ocean (40°S–30°N, 20–120°E)',
    resolution: '1/4°',
    update_frequency: 'Daily NRT',
    format: 'NetCDF-4 / JSON API',
    is_live: true,
  },
  {
    id: 'samudra-curr-hycom',
    name: 'INCOIS HYCOM Current Forecast (3D)',
    variable: 'current_velocity',
    source: 'SAMUDRA / INCOIS-HYCOM',
    temporal_coverage: '5-day forecast',
    spatial_coverage: 'Indian Ocean (40°S–30°N)',
    resolution: '1/12°',
    update_frequency: '6-hourly',
    format: 'GRIB2 / JSON API',
    is_live: true,
  },
  {
    id: 'samudra-chl-modis',
    name: 'INCOIS Chlorophyll-a (MODIS-AQUA)',
    variable: 'chlorophyll',
    source: 'SAMUDRA / INCOIS / NASA GSFC',
    temporal_coverage: '8-day composite',
    spatial_coverage: 'Indian Ocean + coastal',
    resolution: '4 km',
    update_frequency: 'Weekly',
    format: 'NetCDF-4 / JSON API',
    is_live: true,
  },
  {
    id: 'samudra-argo-gdac',
    name: 'INCOIS Argo Float Data (GDAC mirror)',
    variable: 'temperature',
    source: 'SAMUDRA / INCOIS-GDAC',
    temporal_coverage: 'Last 90 days profiles',
    spatial_coverage: 'Indian Ocean (all basins)',
    resolution: 'Point observations',
    update_frequency: 'Real-time (≤24h)',
    format: 'NetCDF / JSON API',
    is_live: true,
  },
  {
    id: 'samudra-pfz',
    name: 'INCOIS Potential Fishing Zone (PFZ) Advisory',
    variable: 'chlorophyll',
    source: 'SAMUDRA / INCOIS / ESSO-MoES',
    temporal_coverage: 'Daily forecast',
    spatial_coverage: 'Indian EEZ coastal waters',
    resolution: '4 km',
    update_frequency: 'Daily 08:00 IST',
    format: 'GeoTIFF / JSON API',
    is_live: true,
  },
]

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function samudraFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  if (!isSamudraConfigured) {
    console.info('[SAMUDRA] No API key — using demo data')
    return null
  }

  const url = new URL(`${SAMUDRA_BASE}${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${SAMUDRA_API_KEY}`,
        Accept: 'application/json',
        'X-Platform': 'OceanIQ-INCOIS',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.warn(`[SAMUDRA] HTTP ${res.status} for ${endpoint}`)
      return null
    }

    return (await res.json()) as T
  } catch (err) {
    console.warn('[SAMUDRA] Fetch failed:', err)
    return null
  }
}

// ─── Demo Data Generators ─────────────────────────────────────────────────────

function makeDemoField(variable: OceanVariable, depth: number): SamudraFieldResponse {
  const lats = Array.from({ length: 20 }, (_, i) => -5 + i * 2)   // -5 to 33
  const lons = Array.from({ length: 25 }, (_, i) => 50 + i * 2.4) // 50 to 108

  const values: number[][] = lats.map((lat) =>
    lons.map((lon) => {
      const base = variable === 'temperature'
        ? 28 - Math.abs(lat) * 0.3 - depth * 0.008 + Math.sin(lon * 0.1) * 0.5
        : variable === 'salinity'
        ? 35.2 + Math.cos(lat * 0.1) * 0.3 - (lon - 80) * 0.005
        : variable === 'sea_level'
        ? Math.sin(lat * 0.2) * 12 + Math.cos(lon * 0.15) * 8
        : variable === 'chlorophyll'
        ? Math.max(0.05, 0.5 - depth * 0.001 + Math.sin((lat - 15) * 0.3) * 0.25)
        : variable === 'current_velocity'
        ? Math.abs(Math.sin(lat * 0.2) * Math.cos(lon * 0.1)) * 0.8
        : 0
      return Math.round(base * 100) / 100
    })
  )

  const units: Record<string, string> = {
    temperature: '°C',
    salinity: 'PSU',
    sea_level: 'cm',
    chlorophyll: 'mg/m³',
    current_velocity: 'm/s',
    oxygen: 'µmol/kg',
    phytoplankton: 'cell/L',
    sea_surface_height: 'cm',
    current_u: 'm/s',
    current_v: 'm/s',
    current_w: 'm/s',
  }

  return {
    variable,
    depth_m: depth,
    timestamp: new Date().toISOString(),
    latitudes: lats,
    longitudes: lons,
    values,
    unit: units[variable] ?? '',
    source: 'samudra_demo',
    quality: 'NRT',
  }
}

function makeDemoArgoPositions(): SamudraArgoPosition[] {
  const platforms = [
    { id: 'IN-BOB-001', wmo: 6902823, lat: 14.3, lon: 85.2 },
    { id: 'IN-BOB-002', wmo: 6902824, lat: 18.1, lon: 88.5 },
    { id: 'IN-AS-003',  wmo: 6903100, lat: 15.8, lon: 64.3 },
    { id: 'IN-AS-004',  wmo: 6903101, lat: 12.5, lon: 62.1 },
    { id: 'IN-EIO-005', wmo: 6903200, lat: 1.2,  lon: 80.4 },
  ]
  return platforms.map((p) => ({
    platform_id: p.id,
    wmo_id: p.wmo,
    latitude: p.lat + (Math.random() - 0.5) * 0.5,
    longitude: p.lon + (Math.random() - 0.5) * 0.5,
    last_profile_date: new Date(Date.now() - Math.random() * 72 * 3600_000).toISOString(),
    last_depth_m: 100 + Math.floor(Math.random() * 1900),
    temperature_at_surface: 26 + Math.random() * 4,
    salinity_at_surface: 34.8 + Math.random() * 0.8,
    cycle_number: 40 + Math.floor(Math.random() * 60),
    status: 'active' as const,
  }))
}

// ─── Public API Functions ─────────────────────────────────────────────────────

/**
 * Fetch ocean field grid for a given variable and depth.
 * Falls back to demo data if SAMUDRA is not configured.
 */
export async function fetchSamudraField(
  variable: OceanVariable,
  depth: number,
  timestamp?: string,
): Promise<SamudraFieldResponse> {
  const live = await samudraFetch<SamudraFieldResponse>('/ocean/field', {
    variable,
    depth: String(depth),
    timestamp: timestamp ?? new Date().toISOString(),
  })
  return live ?? makeDemoField(variable, depth)
}

/**
 * Fetch latest Argo float positions in the Indian Ocean.
 */
export async function fetchSamudraArgoPositions(): Promise<SamudraArgoPosition[]> {
  const live = await samudraFetch<SamudraArgoPosition[]>('/argo/positions', {
    ocean: 'indian',
    days: '30',
  })
  return live ?? makeDemoArgoPositions()
}

/**
 * Fetch PFZ advisories for the current day.
 */
export async function fetchSamudraPFZ(): Promise<SamudraPFZAdvisory[]> {
  const live = await samudraFetch<SamudraPFZAdvisory[]>('/pfz/advisories', {
    date: new Date().toISOString().split('T')[0],
  })
  if (live) return live

  // Demo PFZ data
  return [
    {
      id: 'pfz-kerala-001',
      date: new Date().toISOString().split('T')[0],
      region: 'Kerala Coast',
      latitude_range: [8.5, 11.0],
      longitude_range: [74.5, 76.5],
      confidence: 'high',
      expected_fish_species: ['Tuna', 'Mackerel', 'Sardines'],
      sst_c: 27.8,
      chlorophyll_mg_m3: 0.62,
    },
    {
      id: 'pfz-tn-002',
      date: new Date().toISOString().split('T')[0],
      region: 'Tamil Nadu Coast',
      latitude_range: [9.0, 12.5],
      longitude_range: [79.5, 82.0],
      confidence: 'medium',
      expected_fish_species: ['Seer Fish', 'Shrimp', 'Pomfret'],
      sst_c: 28.3,
      chlorophyll_mg_m3: 0.45,
    },
  ]
}

/**
 * Check SAMUDRA API connectivity.
 */
export async function checkSamudraConnection(): Promise<{
  connected: boolean
  latency_ms: number
  message: string
}> {
  if (!isSamudraConfigured) {
    return { connected: false, latency_ms: 0, message: 'No SAMUDRA API key configured' }
  }

  const start = Date.now()
  const result = await samudraFetch<{ status: string }>('/health')
  const latency_ms = Date.now() - start

  if (result) {
    return { connected: true, latency_ms, message: 'SAMUDRA LIVE — Connected' }
  }
  return { connected: false, latency_ms, message: 'SAMUDRA unreachable — using demo data' }
}
