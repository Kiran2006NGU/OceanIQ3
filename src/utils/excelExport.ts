/**
 * excelExport.ts — Excel & CSV Export Utilities
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Uses SheetJS (xlsx) for Excel generation — fully client-side, no backend needed.
 * Supports:
 * - Observation profiles (Argo/Glider/CTD) → Excel with depth profile sheets
 * - Model data grids → Excel with lat/lon/depth/value sheets
 * - Comparison results → Excel with matched pairs and residuals
 * - Raw arrays → Excel with auto-detected headers
 */

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { MockObservation } from '@/services/data/mockOceanData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWorkbook(): XLSX.WorkBook {
  return XLSX.utils.book_new()
}

function addSheet(wb: XLSX.WorkBook, data: Record<string, unknown>[], sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  // Auto-width columns
  const colWidths = Object.keys(data[0] ?? {}).map((key) => ({
    wch: Math.max(key.length + 2, 12),
  }))
  ws['!cols'] = colWidths
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)) // Excel limit: 31 chars
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, filename)
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

// ─── Export: Observation List ─────────────────────────────────────────────────

export function exportObservationsToExcel(observations: MockObservation[], filename = 'OceanIQ_Observations.xlsx') {
  const wb = makeWorkbook()

  // Sheet 1: Summary
  const summary = observations.map((obs) => ({
    'Platform ID': obs.id,
    'Platform Name': obs.platformName ?? obs.name,
    'Type': obs.type.toUpperCase(),
    'Latitude (°N)': obs.latitude,
    'Longitude (°E)': obs.longitude,
    'Current Depth (m)': obs.currentDepth,
    'Temperature (°C)': obs.temperature,
    'Salinity (PSU)': obs.salinity,
    'Chlorophyll (mg/m³)': obs.chlorophyll ?? '',
    'Status': obs.quality_status ?? 'Active',
    'Last Updated': obs.timestamp,
    'Data Source': 'INCOIS / OceanIQ',
  }))
  addSheet(wb, summary, 'Observations Summary')

  // Sheet 2: Depth Profiles (if available)
  const profileRows: Record<string, unknown>[] = []
  observations.forEach((obs) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (obs as any).profile as Array<Record<string, number>> | undefined
    if (profile) {
      profile.forEach((p) => {
        profileRows.push({
          'Platform ID': obs.id,
          'Type': obs.type.toUpperCase(),
          'Latitude': obs.latitude,
          'Longitude': obs.longitude,
          'Depth (m)': p['depth'],
          'Temperature (°C)': p['temperature'] ?? '',
          'Salinity (PSU)': p['salinity'] ?? '',
          'Chlorophyll (mg/m³)': p['chlorophyll'] ?? '',
          'Dissolved O₂ (µmol/kg)': p['oxygen'] ?? '',
        })
      })
    }
  })
  if (profileRows.length > 0) addSheet(wb, profileRows, 'Depth Profiles')

  // Sheet 3: Metadata
  addSheet(wb, [
    { Field: 'Export Date', Value: new Date().toISOString() },
    { Field: 'Platform Count', Value: observations.length },
    { Field: 'Source', Value: 'OceanIQ — INCOIS Ocean Intelligence Platform' },
    { Field: 'Coverage', Value: 'Indian Ocean' },
    { Field: 'Coordinate System', Value: 'WGS84 / EPSG:4326' },
    { Field: 'Depth Convention', Value: 'Positive downward (m)' },
  ], 'Metadata')

  downloadWorkbook(wb, filename)
}

export function exportObservationsToCSV(observations: MockObservation[], filename = 'OceanIQ_Observations.csv') {
  const data = observations.map((obs) => ({
    'Platform ID': obs.id,
    'Type': obs.type.toUpperCase(),
    'Latitude': obs.latitude,
    'Longitude': obs.longitude,
    'Depth (m)': obs.currentDepth,
    'Temperature (°C)': obs.temperature,
    'Salinity (PSU)': obs.salinity,
    'Chlorophyll (mg/m³)': obs.chlorophyll ?? '',
    'Timestamp': obs.timestamp,
  }))
  downloadCSV(data, filename)
}

// ─── Export: Generic Data Array ───────────────────────────────────────────────

export function exportArrayToExcel(
  data: Record<string, unknown>[],
  filename = 'OceanIQ_Data.xlsx',
  sheetName = 'Data',
) {
  const wb = makeWorkbook()
  addSheet(wb, data, sheetName)
  // Metadata sheet
  addSheet(wb, [
    { Field: 'Export Date', Value: new Date().toISOString() },
    { Field: 'Records', Value: data.length },
    { Field: 'Source', Value: 'OceanIQ — INCOIS Ocean Intelligence Platform' },
  ], 'Info')
  downloadWorkbook(wb, filename)
}

// ─── Export: Model Comparison Results ─────────────────────────────────────────

export interface ComparisonRow {
  obs_id: string
  obs_lat: number
  obs_lon: number
  obs_depth: number
  obs_value: number
  model_value: number
  residual: number
  abs_error: number
  variable: string
  unit: string
  timestamp: string
}

export function exportComparisonToExcel(rows: ComparisonRow[], filename = 'OceanIQ_Comparison.xlsx') {
  const wb = makeWorkbook()

  // Sheet 1: All matched pairs
  addSheet(wb, rows.map((r) => ({
    'Observation ID': r.obs_id,
    'Latitude (°N)': r.obs_lat,
    'Longitude (°E)': r.obs_lon,
    'Depth (m)': r.obs_depth,
    'Observed Value': r.obs_value,
    'Model Value': r.model_value,
    'Residual (M - O)': r.residual,
    'Absolute Error': r.abs_error,
    'Variable': r.variable,
    'Unit': r.unit,
    'Timestamp': r.timestamp,
  })), 'Matched Pairs')

  // Sheet 2: Statistics
  if (rows.length > 0) {
    const residuals = rows.map((r) => r.residual)
    const absErrors = rows.map((r) => r.abs_error)
    const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length
    const rmse = Math.sqrt(mean(rows.map((r) => r.residual ** 2)))
    addSheet(wb, [
      { Metric: 'N Matched Pairs', Value: rows.length },
      { Metric: 'Mean Bias (M - O)', Value: mean(residuals).toFixed(4) },
      { Metric: 'MAE', Value: mean(absErrors).toFixed(4) },
      { Metric: 'RMSE', Value: rmse.toFixed(4) },
      { Metric: 'Min Residual', Value: Math.min(...residuals).toFixed(4) },
      { Metric: 'Max Residual', Value: Math.max(...residuals).toFixed(4) },
    ], 'Statistics')
  }

  addSheet(wb, [
    { Field: 'Export Date', Value: new Date().toISOString() },
    { Field: 'Source', Value: 'OceanIQ Model vs Observation Comparison — INCOIS' },
  ], 'Metadata')

  downloadWorkbook(wb, filename)
}

// ─── Export: Ocean Field Grid ─────────────────────────────────────────────────

export function exportFieldGridToExcel(
  lats: number[],
  lons: number[],
  values: number[][],
  variable: string,
  unit: string,
  depth: number,
  timestamp: string,
  filename = 'OceanIQ_Field.xlsx',
) {
  const wb = makeWorkbook()

  // Flatten grid
  const rows: Record<string, unknown>[] = []
  lats.forEach((lat, li) => {
    lons.forEach((lon, lj) => {
      rows.push({
        'Latitude (°N)': lat,
        'Longitude (°E)': lon,
        'Depth (m)': depth,
        [`${variable} (${unit})`]: values[li]?.[lj] ?? '',
        'Timestamp': timestamp,
      })
    })
  })

  addSheet(wb, rows, `${variable} @ ${depth}m`)
  addSheet(wb, [
    { Field: 'Variable', Value: variable },
    { Field: 'Unit', Value: unit },
    { Field: 'Depth (m)', Value: depth },
    { Field: 'Timestamp', Value: timestamp },
    { Field: 'Source', Value: 'OceanIQ — INCOIS / SAMUDRA' },
    { Field: 'Lat Points', Value: lats.length },
    { Field: 'Lon Points', Value: lons.length },
    { Field: 'Total Grid Points', Value: lats.length * lons.length },
  ], 'Grid Info')

  downloadWorkbook(wb, filename)
}
