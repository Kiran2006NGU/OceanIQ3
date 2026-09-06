/**
 * dataSource.ts — Unified data source with dynamic dataset switching & fallback
 * SIH 26067 | Ocean Intelligence Platform
 *
 * Supports:
 * - 'demo-ocean' (Synthetic demo)
 * - 'incois-hycom-real' (Local Real INCOIS NetCDF)
 * - Transparent fallback to local mock data when offline or backend unavailable
 */

import type { OceanVariable, DatasetCatalogItem } from '@/types/ocean'
import {
  getModelTimes,
  getObservations,
  getOceanValue as mockGetOceanValue,
  getProfileData,
  getCurrentVectors as mockGetCurrentVectors,
  type MockObservation,
  type ModelTime,
  type ProfilePoint,
  type CurrentVector,
  DEMO_DEPTHS,
} from './mockOceanData'
import {
  apiGetDatasets,
  apiGetModelTimes,
  apiGetDepths,
  apiGetObservations,
  apiGetObservationProfile,
  apiGetOceanField,
  apiGetCurrentVectors,
  type ApiOceanFieldResponse,
  DEFAULT_DATASET,
} from './apiOceanData'

// ─── Mode detection & Circuit Breaker ────────────────────────────────────────

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock' | 'api'

export const isApiMode = DATA_SOURCE === 'api'

let backendOfflineUntil = 0
const OFFLINE_COOLDOWN_MS = 15_000 // If backend fails, use mock for 15s before re-checking

function isBackendConsideredOffline(): boolean {
  return Date.now() < backendOfflineUntil
}

function markBackendOffline(): void {
  backendOfflineUntil = Date.now() + OFFLINE_COOLDOWN_MS
}

// ─── Fallback helper ──────────────────────────────────────────────────────────

async function withFallback<T>(
  label: string,
  apiFn: () => Promise<T>,
  mockFn: () => T,
): Promise<T> {
  if (!isApiMode || isBackendConsideredOffline()) return mockFn()
  try {
    return await apiFn()
  } catch (err) {
    markBackendOffline()
    // Suppress console warning spam once backend is marked offline
    return mockFn()
  }
}

// ─── Public unified API ───────────────────────────────────────────────────────

/** Get available datasets catalog */
export async function getDataSourceDatasets(): Promise<DatasetCatalogItem[]> {
  return withFallback('getDatasets', () => apiGetDatasets(), () => [
    {
      id: 'demo-ocean',
      name: 'Demo Indian Ocean Model (Synthetic)',
      provider: 'OceanIQ Demo Pipeline',
      format: 'NetCDF',
      variables: ['temperature', 'salinity', 'chlorophyll', 'current_u', 'current_v'],
      dimensions: { time: 5, depth: 9, latitude: 30, longitude: 40 },
      is_demo: true,
      is_real_data: false,
      status: 'DEMO',
    },
    {
      id: 'incois-hycom-real',
      name: 'INCOIS HYCOM Indian Ocean Model',
      provider: 'INCOIS',
      format: 'NetCDF-4',
      variables: ['temperature', 'salinity', 'current_u', 'current_v', 'current_velocity'],
      dimensions: { time: 5, depth: 9, latitude: 35, longitude: 45 },
      is_demo: false,
      is_real_data: true,
      status: 'LOCAL_REAL_DATA',
    },
  ])
}

/** Get available model times for a given dataset */
export async function getDataSourceTimes(datasetId = DEFAULT_DATASET): Promise<ModelTime[]> {
  return withFallback('getModelTimes', () => apiGetModelTimes(datasetId), () => getModelTimes())
}

/** Get available depth levels for a given dataset */
export async function getDataSourceDepths(datasetId = DEFAULT_DATASET): Promise<number[]> {
  return withFallback('getDepths', () => apiGetDepths(datasetId), () => [...DEMO_DEPTHS])
}

/** Get in-situ observations (optionally filtered by real data) */
export async function getDataSourceObservations(isRealData?: boolean): Promise<MockObservation[]> {
  return withFallback(
    'getObservations',
    () => apiGetObservations(isRealData),
    () => getObservations()
  )
}

/**
 * Get a 2-D ocean field for vertex colouring.
 */
export async function getDataSourceOceanField(
  variable: OceanVariable,
  depth: number,
  timeIso: string,
  datasetId = DEFAULT_DATASET,
): Promise<ApiOceanFieldResponse | null> {
  if (!isApiMode || isBackendConsideredOffline()) return null
  try {
    return await apiGetOceanField(variable, depth, timeIso, datasetId)
  } catch {
    markBackendOffline()
    return null
  }
}

/**
 * Synchronous mock value (fallback).
 */
export function getOceanValueSync(
  lat: number,
  lon: number,
  depth: number,
  variable: OceanVariable,
  timeIndex: number,
): number {
  return mockGetOceanValue(lat, lon, depth, variable, timeIndex)
}

/**
 * Get a depth profile for an observation.
 */
export async function getDataSourceObservationProfile(
  obs: MockObservation,
): Promise<ProfilePoint[]> {
  return withFallback(
    `getObservationProfile(${obs.id})`,
    () => apiGetObservationProfile(obs.id),
    () => getProfileData(obs)
  )
}

/**
 * Get current vector grid.
 */
export async function getDataSourceCurrentVectors(
  depth: number,
  timeIndex: number,
  timeIso?: string,
  datasetId = DEFAULT_DATASET,
): Promise<CurrentVector[]> {
  if (isApiMode && timeIso && !isBackendConsideredOffline()) {
    try {
      const vectors = await apiGetCurrentVectors(depth, timeIso, datasetId)
      if (vectors.length > 0) return vectors
    } catch {
      markBackendOffline()
    }
  }
  return mockGetCurrentVectors(depth, timeIndex)
}
