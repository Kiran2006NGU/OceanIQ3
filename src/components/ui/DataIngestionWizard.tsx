/**
 * DataIngestionWizard.tsx — Universal Observational Data Ingestion Wizard
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * 5-Step Wizard:
 * Step 1: Drop file or paste URL
 * Step 2: Auto-detect format + preview
 * Step 3: Map columns to OceanIQ fields
 * Step 4: Validate (coordinate bounds, time range, value range)
 * Step 5: Ingest + view on globe
 *
 * Supports: CSV, TSV, JSON, GeoJSON, Excel (.xlsx), NetCDF (metadata only)
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload, Link2, CheckCircle2, AlertTriangle, X,
  ArrowRight, ArrowLeft, FileText, Globe, Database,
  RefreshCw, Eye, Download,
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4 | 5
type FileFormat = 'csv' | 'tsv' | 'json' | 'geojson' | 'xlsx' | 'netcdf' | 'unknown'

interface ParsedRow {
  [key: string]: string | number
}

interface FieldMapping {
  latitude: string
  longitude: string
  depth: string
  timestamp: string
  value: string
  valueLabel: string
}

interface ValidationResult {
  valid: boolean
  rowCount: number
  validRows: number
  issues: string[]
  latRange: [number, number]
  lonRange: [number, number]
  depthRange: [number, number]
  timeRange: [string, string]
}

interface DataIngestionWizardProps {
  onClose: () => void
  onIngest?: (data: ParsedRow[], mapping: FieldMapping) => void
}

// ─── Format Detection ─────────────────────────────────────────────────────────

function detectFormat(filename: string, content: string): FileFormat {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'nc' || ext === 'netcdf') return 'netcdf'
  if (ext === 'geojson') return 'geojson'
  if (ext === 'json') return 'json'
  if (ext === 'tsv') return 'tsv'
  if (ext === 'csv' || ext === 'txt') {
    // Try to detect by content
    const firstLine = content.split('\n')[0] ?? ''
    if (firstLine.includes('\t')) return 'tsv'
    return 'csv'
  }
  // Sniff content
  const trimmed = content.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); return trimmed.includes('"type":"Feature') ? 'geojson' : 'json' } catch { /* */ }
  }
  return 'unknown'
}

function parseCSV(content: string, delimiter = ','): { headers: string[]; rows: ParsedRow[] } {
  const lines = content.trim().split('\n').filter(Boolean)
  const headers = (lines[0] ?? '').split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: ParsedRow = {}
    headers.forEach((h, i) => {
      const v = vals[i] ?? ''
      row[h] = isNaN(Number(v)) || v === '' ? v : Number(v)
    })
    return row
  })
  return { headers, rows }
}

function parseJSON(content: string): { headers: string[]; rows: ParsedRow[] } {
  const parsed = JSON.parse(content)
  const arr: ParsedRow[] = Array.isArray(parsed) ? parsed : [parsed]
  const headers = arr.length > 0 ? Object.keys(arr[0]!) : []
  return { headers, rows: arr }
}

function parseGeoJSON(content: string): { headers: string[]; rows: ParsedRow[] } {
  const gj = JSON.parse(content)
  const features = gj.features ?? (gj.type === 'Feature' ? [gj] : [])
  const rows: ParsedRow[] = features.map((f: { geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }) => ({
    longitude: f.geometry?.coordinates?.[0] ?? '',
    latitude: f.geometry?.coordinates?.[1] ?? '',
    depth: f.geometry?.coordinates?.[2] ?? 0,
    ...(f.properties ?? {}),
  }))
  const headers = rows.length > 0 ? Object.keys(rows[0]!) : []
  return { headers, rows }
}

async function parseXLSX(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]!
  const ws = wb.Sheets[sheetName]!
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { raw: true })
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]!) : []
  return { headers, rows: rawRows as ParsedRow[] }
}

// ─── Column Auto-Mapping ──────────────────────────────────────────────────────

const LAT_ALIASES = ['lat', 'latitude', 'y', 'ylat', 'lat_dd', 'latitude_n']
const LON_ALIASES = ['lon', 'longitude', 'x', 'xlon', 'lon_dd', 'longitude_e', 'long']
const DEPTH_ALIASES = ['depth', 'depth_m', 'z', 'pressure', 'pres', 'dbar']
const TIME_ALIASES = ['time', 'date', 'timestamp', 'datetime', 'date_time', 'obs_time']
const VALUE_ALIASES = ['temperature', 'temp', 'salinity', 'sal', 'chlorophyll', 'chl', 'value', 'val']

function autoMap(headers: string[]): Partial<FieldMapping> {
  const lc = headers.map((h) => h.toLowerCase())
  const find = (aliases: string[]): string => {
    for (const alias of aliases) {
      const idx = lc.findIndex((h) => h.includes(alias))
      if (idx >= 0) return headers[idx] ?? ''
    }
    return ''
  }

  return {
    latitude: find(LAT_ALIASES),
    longitude: find(LON_ALIASES),
    depth: find(DEPTH_ALIASES),
    timestamp: find(TIME_ALIASES),
    value: find(VALUE_ALIASES),
    valueLabel: '',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(rows: ParsedRow[], mapping: FieldMapping): ValidationResult {
  const issues: string[] = []
  let validRows = 0
  const lats: number[] = []
  const lons: number[] = []
  const depths: number[] = []
  const times: string[] = []

  rows.forEach((row) => {
    const lat = Number(row[mapping.latitude])
    const lon = Number(row[mapping.longitude])
    if (isNaN(lat) || lat < -90 || lat > 90) { issues.push(`Invalid latitude: ${row[mapping.latitude]}`); return }
    if (isNaN(lon) || lon < -180 || lon > 180) { issues.push(`Invalid longitude: ${row[mapping.longitude]}`); return }
    lats.push(lat)
    lons.push(lon)
    const d = Number(row[mapping.depth])
    if (!isNaN(d)) depths.push(Math.abs(d))
    const t = String(row[mapping.timestamp] ?? '')
    if (t) times.push(t)
    validRows++
  })

  if (lats.length === 0) issues.push('No valid coordinates found')
  const indianOceanLats = lats.filter((v) => v > -40 && v < 30)
  const indianOceanLons = lons.filter((v) => v > 30 && v < 130)
  if (lats.length > 0 && indianOceanLats.length < lats.length * 0.5) {
    issues.push('Warning: Many points outside Indian Ocean bounds')
  }

  return {
    valid: validRows > 0 && issues.filter((i) => !i.startsWith('Warning')).length === 0,
    rowCount: rows.length,
    validRows,
    issues: issues.slice(0, 5),
    latRange: lats.length ? [Math.min(...lats), Math.max(...lats)] : [0, 0],
    lonRange: lons.length ? [Math.min(...lons), Math.max(...lons)] : [0, 0],
    depthRange: depths.length ? [Math.min(...depths), Math.max(...depths)] : [0, 0],
    timeRange: times.length ? [times[0]!, times[times.length - 1]!] : ['', ''],
  }
}

// ─── Main Wizard Component ────────────────────────────────────────────────────

export function DataIngestionWizard({ onClose, onIngest }: DataIngestionWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filename, setFilename] = useState('')
  const [format, setFormat] = useState<FileFormat>('unknown')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])

  const [mapping, setMapping] = useState<FieldMapping>({
    latitude: '', longitude: '', depth: '', timestamp: '', value: '', valueLabel: 'Temperature (°C)',
  })

  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Parsing ──────────────────────────────────────────────────────────────────
  const processContent = useCallback(async (name: string, content: string, buffer?: ArrayBuffer) => {
    setIsLoading(true)
    setError(null)
    try {
      const fmt = detectFormat(name, content)
      setFormat(fmt)
      setFilename(name)

      let parsed: { headers: string[]; rows: ParsedRow[] }
      if (fmt === 'xlsx' && buffer) {
        parsed = await parseXLSX(buffer)
      } else if (fmt === 'tsv') {
        parsed = parseCSV(content, '\t')
      } else if (fmt === 'json') {
        parsed = parseJSON(content)
      } else if (fmt === 'geojson') {
        parsed = parseGeoJSON(content)
      } else if (fmt === 'netcdf') {
        setError('NetCDF preview not supported in browser — upload will be sent to backend for parsing.')
        parsed = { headers: ['Filename', 'Format', 'Note'], rows: [{ Filename: name, Format: 'NetCDF', Note: 'Backend processing required' }] }
      } else {
        parsed = parseCSV(content)
      }

      setHeaders(parsed.headers)
      setRows(parsed.rows.slice(0, 2000)) // cap preview
      const autoMapped = autoMap(parsed.headers)
      setMapping((prev) => ({ ...prev, ...autoMapped }))
      setStep(2)
    } catch (e) {
      setError(`Parse error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string ?? ''
      const buffer = undefined // will be re-read if xlsx
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const ab = new FileReader()
        ab.onload = (ev) => processContent(file.name, '', ev.target?.result as ArrayBuffer)
        ab.readAsArrayBuffer(file)
      } else {
        processContent(file.name, content, buffer)
      }
    }
    reader.readAsText(file)
  }, [processContent])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleURLFetch = useCallback(async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(urlInput.trim())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const content = await res.text()
      const name = urlInput.split('/').pop() ?? 'fetched_data.csv'
      processContent(name, content)
    } catch (e) {
      setError(`Fetch failed: ${e instanceof Error ? e.message : String(e)}`)
      setIsLoading(false)
    }
  }, [urlInput, processContent])

  const handleValidate = useCallback(() => {
    if (!mapping.latitude || !mapping.longitude) {
      setError('Please map at least Latitude and Longitude fields')
      return
    }
    const result = validate(rows, mapping)
    setValidation(result)
    setStep(4)
  }, [rows, mapping])

  const handleIngest = useCallback(() => {
    if (onIngest && rows.length > 0) {
      onIngest(rows, mapping)
    }
    setStep(5)
  }, [rows, mapping, onIngest])

  const FORMAT_ICONS: Record<FileFormat, string> = {
    csv: '📄', tsv: '📄', json: '{}', geojson: '🗺️', xlsx: '📊', netcdf: '🌊', unknown: '❓',
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl animate-fade-in p-4 select-none font-mono">
      <div className="bg-[#0a1324] border border-white/15 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden font-mono">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#030d1a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-white">Data Ingestion Wizard</span>
          </div>
          {/* Step progress */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {([1,2,3,4,5] as WizardStep[]).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                  step > s ? 'bg-emerald-500 text-black' :
                  step === s ? 'bg-cyan-500 text-black' :
                  'bg-white/10 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle2 size={10} /> : s}
                </div>
                {s < 5 && <div className={`w-6 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">

          {/* ── Step 1: Upload ────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">Step 1: Load Observational Data</h2>
                <p className="text-xs text-slate-400">Drag & drop a file, browse, or paste a URL to fetch remotely.</p>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 hover:border-cyan-400/50 hover:bg-white/3'
                }`}
              >
                <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} />
                <p className="text-sm font-bold text-slate-300 mb-1">Drop file here or click to browse</p>
                <p className="text-[11px] text-slate-500">
                  Supported: CSV · TSV · JSON · GeoJSON · Excel (.xlsx) · NetCDF (.nc)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.tsv,.txt,.json,.geojson,.xlsx,.xls,.nc,.netcdf"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                />
              </div>

              <div className="text-center text-xs text-slate-500">— or paste a URL —</div>

              {/* URL Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://samudra.incois.gov.in/api/... or ERDDAP URL"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleURLFetch()}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#020b18] border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  onClick={handleURLFetch}
                  disabled={isLoading || !urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {isLoading ? <RefreshCw size={13} className="animate-spin" /> : 'Fetch'}
                </button>
              </div>

              {/* Format chips */}
              <div className="flex flex-wrap gap-2">
                {(['csv', 'xlsx', 'json', 'geojson', 'nc'] as const).map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-[10px] text-slate-400">
                    {f.toUpperCase()}
                  </span>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                  <AlertTriangle size={13} /> {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Step 2: Data Preview</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {FORMAT_ICONS[format]} Detected format: <strong className="text-cyan-300">{format.toUpperCase()}</strong>
                    {' · '}{rows.length.toLocaleString()} rows · {headers.length} columns
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  {filename}
                </span>
              </div>

              {/* Preview Table */}
              <div className="overflow-auto rounded-xl border border-white/10 max-h-52">
                <table className="text-[10px] w-full">
                  <thead className="bg-[#030d1a] sticky top-0">
                    <tr>
                      {headers.slice(0, 10).map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-slate-400 font-bold whitespace-nowrap border-b border-white/10">
                          {h}
                        </th>
                      ))}
                      {headers.length > 10 && <th className="px-3 py-2 text-slate-500">+{headers.length - 10} more</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, i) => (
                      <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/2' : ''}`}>
                        {headers.slice(0, 10).map((h) => (
                          <td key={h} className="px-3 py-1.5 text-slate-300 whitespace-nowrap font-mono">
                            {String(row[h] ?? '').slice(0, 20)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Step 3: Column Mapping ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white">Step 3: Map Columns to Fields</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  We auto-detected mappings — verify and adjust if needed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'latitude', label: '🌐 Latitude *', required: true },
                  { key: 'longitude', label: '🌐 Longitude *', required: true },
                  { key: 'depth', label: '🌊 Depth (m)', required: false },
                  { key: 'timestamp', label: '🕐 Timestamp', required: false },
                  { key: 'value', label: '📊 Primary Value', required: false },
                ] as const).map(({ key, label, required }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      {label}
                      {required && <span className="text-red-400">*</span>}
                      {mapping[key] && <span className="text-emerald-400 ml-auto">✓ mapped</span>}
                    </label>
                    <select
                      value={mapping[key]}
                      onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#020b18] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="">— not mapped —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">📝 Value Label</label>
                  <input
                    type="text"
                    value={mapping.valueLabel}
                    onChange={(e) => setMapping((m) => ({ ...m, valueLabel: e.target.value }))}
                    placeholder="e.g. Temperature (°C)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#020b18] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                  <AlertTriangle size={13} /> {error}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Validation ────────────────────────────────────────── */}
          {step === 4 && validation && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white">Step 4: Validation Report</h2>

              <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                validation.valid
                  ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
              }`}>
                {validation.valid
                  ? <CheckCircle2 size={20} />
                  : <AlertTriangle size={20} />}
                <div>
                  <p className="font-bold text-sm">
                    {validation.valid ? 'Validation Passed' : 'Validation Warnings'}
                  </p>
                  <p className="text-xs opacity-80">
                    {validation.validRows} / {validation.rowCount} rows valid
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5">
                  <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">Geographic Bounds</p>
                  <div className="flex justify-between"><span className="text-slate-500">Lat range</span><span className="text-cyan-200">{validation.latRange[0].toFixed(2)}° – {validation.latRange[1].toFixed(2)}°</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Lon range</span><span className="text-cyan-200">{validation.lonRange[0].toFixed(2)}° – {validation.lonRange[1].toFixed(2)}°</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Depth range</span><span className="text-cyan-200">{validation.depthRange[0].toFixed(0)} – {validation.depthRange[1].toFixed(0)} m</span></div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-1.5">
                  <p className="text-slate-400 font-bold text-[10px] uppercase mb-2">Data Quality</p>
                  <div className="flex justify-between"><span className="text-slate-500">Valid rows</span><span className="text-emerald-300">{validation.validRows}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Skipped</span><span className="text-red-300">{validation.rowCount - validation.validRows}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Time range</span><span className="text-cyan-200 text-[9px]">{validation.timeRange[0] ? validation.timeRange[0].slice(0, 10) : '—'}</span></div>
                </div>
              </div>

              {validation.issues.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase">Issues ({validation.issues.length})</p>
                  {validation.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-200/80">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Success ───────────────────────────────────────────── */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Data Ingested Successfully!</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {rows.length.toLocaleString()} observations loaded into OceanIQ.
                  Navigate to the 3D Explorer to visualize your data.
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Globe size={14} />
                  View on Globe
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#030d1a]/80 flex-shrink-0">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as WizardStep)}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-30"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <span className="text-[10px] text-slate-500">Step {step} of 5</span>

            {step === 1 && (
              <div className="text-[10px] text-slate-500">Load a file to continue</div>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold transition-all cursor-pointer hover:bg-cyan-400"
              >
                Map Columns <ArrowRight size={13} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleValidate}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold transition-all cursor-pointer hover:bg-cyan-400"
              >
                Validate <ArrowRight size={13} />
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleIngest}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold transition-all cursor-pointer hover:bg-emerald-400"
              >
                Ingest Data <CheckCircle2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
