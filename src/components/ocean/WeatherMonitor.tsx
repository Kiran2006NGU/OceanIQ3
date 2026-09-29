/**
 * WeatherMonitor.tsx — Real-time Weather Detection & Monitoring Widget
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Integrates with Open-Meteo API (free, no API key) for:
 * - Temperature, humidity, wind speed/direction, pressure, visibility
 * - Weather conditions (clear, rain, storm, fog, etc.)
 * - Ocean surface weather relevant to maritime operations
 * - 5-location weather summary (Arabian Sea coast, Bay of Bengal, etc.)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  CloudRain,
  Sun,
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Navigation,
  RefreshCw,
  Gauge,
  Waves,
  CloudSnow,
  CloudLightning,
  CloudFog,
  MapPin,
} from 'lucide-react'

interface WeatherLocation {
  id: string
  name: string
  shortName: string
  lat: number
  lon: number
  region: string
}

interface WeatherData {
  locationId: string
  temperature: number       // °C
  windSpeed: number         // km/h
  windDirection: number     // degrees
  humidity: number          // %
  pressure: number          // hPa
  visibility: number        // km
  weatherCode: number       // WMO weather code
  isDay: number             // 1=day, 0=night
  precipProbability: number // %
}

const OCEAN_LOCATIONS: WeatherLocation[] = [
  { id: 'mumbai', name: 'Mumbai Coast', shortName: 'MUM', lat: 18.96, lon: 72.82, region: 'Arabian Sea' },
  { id: 'chennai', name: 'Chennai Coast', shortName: 'CHN', lat: 13.08, lon: 80.27, region: 'Bay of Bengal' },
  { id: 'cochin', name: 'Kochi / Lakshadweep', shortName: 'COK', lat: 9.93, lon: 76.26, region: 'Arabian Sea' },
  { id: 'vizag', name: 'Visakhapatnam', shortName: 'VIZ', lat: 17.69, lon: 83.22, region: 'Bay of Bengal' },
  { id: 'port_blair', name: 'Port Blair, Andaman', shortName: 'PBL', lat: 11.67, lon: 92.74, region: 'Andaman Sea' },
]

function getWeatherLabel(code: number): string {
  if (code === 0) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 49) return 'Foggy'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 84) return 'Showers'
  if (code <= 89) return 'Thunderstorm'
  if (code >= 95) return 'Severe Storm'
  return 'Variable'
}

function WeatherIcon({ code, size = 16, className = '' }: { code: number; size?: number; className?: string }) {
  if (code === 0) return <Sun size={size} className={`text-amber-400 ${className}`} />
  if (code <= 3) return <Cloud size={size} className={`text-slate-300 ${className}`} />
  if (code <= 49) return <CloudFog size={size} className={`text-slate-400 ${className}`} />
  if (code <= 69) return <CloudRain size={size} className={`text-blue-400 ${className}`} />
  if (code <= 79) return <CloudSnow size={size} className={`text-sky-200 ${className}`} />
  if (code <= 89) return <CloudRain size={size} className={`text-indigo-400 ${className}`} />
  return <CloudLightning size={size} className={`text-yellow-400 ${className}`} />
}

function getWindCategory(speed: number): { label: string; color: string } {
  if (speed < 20) return { label: 'Calm', color: 'text-emerald-400' }
  if (speed < 40) return { label: 'Moderate', color: 'text-amber-400' }
  if (speed < 62) return { label: 'Strong', color: 'text-orange-400' }
  if (speed < 89) return { label: 'Gale', color: 'text-red-400' }
  return { label: 'Storm', color: 'text-red-500' }
}

function getCardinalDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

async function fetchWeatherForLocation(loc: WeatherLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'visibility',
      'weather_code',
      'is_day',
      'precipitation_probability',
    ].join(','),
    timezone: 'auto',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Weather API error for ${loc.name}`)
  const data = await res.json()
  const c = data.current

  return {
    locationId: loc.id,
    temperature: Math.round(c.temperature_2m),
    windSpeed: Math.round(c.wind_speed_10m),
    windDirection: c.wind_direction_10m,
    humidity: c.relative_humidity_2m,
    pressure: Math.round(c.surface_pressure),
    visibility: Math.round((c.visibility ?? 10000) / 1000),
    weatherCode: c.weather_code,
    isDay: c.is_day,
    precipProbability: c.precipitation_probability ?? 0,
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface WeatherMonitorProps {
  compact?: boolean
  selectedRegion?: string
}

export function WeatherMonitor({ compact = false, selectedRegion }: WeatherMonitorProps) {
  const [weatherData, setWeatherData] = useState<Map<string, WeatherData>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedLoc, setSelectedLoc] = useState<string>('mumbai')
  const [isFetching, setIsFetching] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsFetching(true)
    setError(null)
    try {
      const results = await Promise.allSettled(
        OCEAN_LOCATIONS.map(loc => fetchWeatherForLocation(loc))
      )
      const newMap = new Map<string, WeatherData>()
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          newMap.set(OCEAN_LOCATIONS[i].id, r.value)
        }
      })
      setWeatherData(newMap)
      setLastUpdate(new Date())
    } catch (e) {
      setError('Weather data unavailable — check network connectivity')
    } finally {
      setIsFetching(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000) // every 5 mins
    return () => clearInterval(interval)
  }, [fetchAll])

  const currentLoc = OCEAN_LOCATIONS.find(l => l.id === selectedLoc)!
  const currentWeather = weatherData.get(selectedLoc)
  const windCategory = currentWeather ? getWindCategory(currentWeather.windSpeed) : null

  if (compact) {
    // Compact widget for embedding in dashboard/header
    return (
      <div className="flex items-center gap-2 text-xs font-mono">
        {isLoading ? (
          <div className="flex items-center gap-1 text-slate-400">
            <RefreshCw size={10} className="animate-spin" />
            <span>Loading weather...</span>
          </div>
        ) : currentWeather ? (
          <>
            <WeatherIcon code={currentWeather.weatherCode} size={14} />
            <span className="text-white font-bold">{currentWeather.temperature}°C</span>
            <span className="text-slate-400 hidden sm:inline">{getWeatherLabel(currentWeather.weatherCode)}</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Wind size={11} className={windCategory?.color} />
              <span>{currentWeather.windSpeed} km/h</span>
            </div>
          </>
        ) : (
          <span className="text-slate-500">No weather data</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 font-sans text-xs h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Cloud size={15} className="text-sky-400" />
          <span className="font-bold text-white">Weather Monitor</span>
          <span className="text-[9px] font-mono text-slate-400">Marine Stations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500">
            {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={fetchAll}
            disabled={isFetching}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Location Selector Pills ── */}
      <div className="flex gap-1.5 flex-wrap flex-shrink-0">
        {OCEAN_LOCATIONS.map(loc => (
          <button
            key={loc.id}
            onClick={() => setSelectedLoc(loc.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
              selectedLoc === loc.id
                ? 'bg-sky-500/30 border border-sky-400/60 text-sky-200'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            <MapPin size={9} />
            {loc.shortName}
          </button>
        ))}
      </div>

      {/* ── Error / Loading ── */}
      {error && (
        <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-[10px] font-mono">
          {error}
        </div>
      )}

      {/* ── Main Weather Card ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span>Fetching weather data...</span>
          </div>
        </div>
      ) : currentWeather ? (
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {/* Primary condition display */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-sky-950/60 to-slate-950/60 border border-sky-500/30 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1">
                  <MapPin size={10} />
                  <span>{currentLoc.name}</span>
                  <span className="text-sky-400">· {currentLoc.region}</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {currentWeather.temperature}°C
                </div>
                <div className="text-sm text-slate-300 font-medium mt-0.5">
                  {getWeatherLabel(currentWeather.weatherCode)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <WeatherIcon code={currentWeather.weatherCode} size={32} />
              </div>
            </div>

            {/* Wind speed bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Wind Speed</span>
                <div className="flex items-center gap-1.5">
                  <Navigation
                    size={10}
                    className={windCategory?.color}
                    style={{ transform: `rotate(${currentWeather.windDirection}deg)` }}
                  />
                  <span className={`font-bold ${windCategory?.color}`}>{currentWeather.windSpeed} km/h</span>
                  <span className="text-slate-400">{getCardinalDir(currentWeather.windDirection)}</span>
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${windCategory?.color} bg-current/10 border border-current/20`}>
                    {windCategory?.label}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentWeather.windSpeed < 40 ? 'bg-emerald-400' :
                    currentWeather.windSpeed < 62 ? 'bg-amber-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, (currentWeather.windSpeed / 120) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                <Droplets size={9} className="text-blue-400" />
                Humidity
              </div>
              <div className="text-base font-black text-white">{currentWeather.humidity}%</div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{ width: `${currentWeather.humidity}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                <Gauge size={9} className="text-purple-400" />
                Pressure
              </div>
              <div className="text-base font-black text-white">{currentWeather.pressure}</div>
              <div className="text-[9px] font-mono text-slate-400">hPa</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                <Eye size={9} className="text-cyan-400" />
                Visibility
              </div>
              <div className="text-base font-black text-white">{currentWeather.visibility}</div>
              <div className="text-[9px] font-mono text-slate-400">km</div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                <CloudRain size={9} className="text-indigo-400" />
                Precip Risk
              </div>
              <div className="text-base font-black text-white">{currentWeather.precipProbability}%</div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400"
                  style={{ width: `${currentWeather.precipProbability}%` }}
                />
              </div>
            </div>
          </div>

          {/* All stations summary */}
          <div className="space-y-1">
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              All Stations Overview
            </div>
            {OCEAN_LOCATIONS.map(loc => {
              const wd = weatherData.get(loc.id)
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLoc(loc.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all cursor-pointer text-left ${
                    selectedLoc === loc.id
                      ? 'bg-sky-950/50 border border-sky-400/30'
                      : 'bg-white/3 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {wd ? (
                      <WeatherIcon code={wd.weatherCode} size={13} />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-700" />
                    )}
                    <span className="text-[10px] font-mono text-slate-300">{loc.shortName}</span>
                    <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">{loc.region}</span>
                  </div>
                  {wd ? (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-white font-bold">{wd.temperature}°C</span>
                      <span className={`${getWindCategory(wd.windSpeed).color}`}>{wd.windSpeed}km/h</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-[9px]">—</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Maritime Safety Advisory */}
          {currentWeather.windSpeed >= 40 && (
            <div className={`p-2.5 rounded-xl border ${
              currentWeather.windSpeed >= 62
                ? 'bg-red-950/30 border-red-500/40 text-red-300'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                <Waves size={12} />
                Maritime Safety Advisory
              </div>
              <p className="text-[10px] leading-relaxed opacity-90">
                {currentWeather.windSpeed >= 62
                  ? '⚠️ Gale-force winds. Small craft warning in effect. Avoid open sea navigation.'
                  : '⚡ Strong winds. Moderate wave heights expected. Exercise caution.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-[11px]">
          No weather data for selected location
        </div>
      )}
    </div>
  )
}
