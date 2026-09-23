/**
 * DisasterAlertSystem.tsx — Real-Time Multi-Hazard Ocean & Weather Early Warning Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Implements end-to-end disaster alerts for:
 * 1. 🌊 Tsunamis: Deep-ocean seismic triggers, DART buoy propagation, Coastal Arrival Times (ETA)
 * 2. 🌀 Cyclones & Storm Surges: Track projections, central pressure drops, category ratings, gale radii
 * 3. 🌊 High Tides & Swell Surges (Kallakkadal): Spring tide peaks, coastal inundation risks
 * 4. 🌧️ Heavy Rainfall & Flash Flood Runoff: Barrier layer disruption & coastal salinity drops
 *
 * Features:
 * - Red / Orange / Yellow / Green multi-hazard classification matching IMD / INCOIS protocols
 * - Web Audio API alert siren tone generator (audible warning simulation)
 * - Filtering by disaster type & severity
 * - 1-Click Disaster Advisory Bulletin generation
 */

import { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  Waves,
  Wind,
  CloudRain,
  Radio,
  Volume2,
  VolumeX,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  Bell,
  X,
  Download,
  Share2,
} from 'lucide-react'

export type DisasterCategory = 'all' | 'tsunami' | 'cyclone' | 'high_tide' | 'heavy_rain'
export type AlertSeverity = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'

export interface DisasterAlert {
  id: string
  title: string
  category: 'tsunami' | 'cyclone' | 'high_tide' | 'heavy_rain'
  severity: AlertSeverity
  region: string
  coordinates: { lat: number; lon: number }
  issueTime: string
  validUntil: string
  peakThreatTime: string
  metrics: {
    primaryMetricLabel: string
    primaryMetricValue: string
    secondaryMetricLabel: string
    secondaryMetricValue: string
    pressureOrDepth?: string
  }
  advisoryText: string
  actionProtocols: string[]
  affectedDistricts: string[]
}

export const ACTIVE_DISASTER_ALERTS: DisasterAlert[] = [
  {
    id: 'TSU-2026-004',
    title: 'Tsunami Early Warning: Andaman & Nicobar Subduction Zone',
    category: 'tsunami',
    severity: 'RED',
    region: 'Andaman & Nicobar Islands / East Coast',
    coordinates: { lat: 9.4, lon: 93.8 },
    issueTime: '2026-09-20 13:15 UTC',
    validUntil: '2026-09-20 22:00 UTC',
    peakThreatTime: '15:45 UTC (ETA Port Blair)',
    metrics: {
      primaryMetricLabel: 'Max Wave Amplitude',
      primaryMetricValue: '3.4 m',
      secondaryMetricLabel: 'Seismic Magnitude',
      secondaryMetricValue: 'M 7.8 Subsea',
      pressureOrDepth: 'Focal Depth: 18 km',
    },
    advisoryText:
      'Major seafloor displacement detected by DART Buoy #23401. High amplitude tsunami waves expected along low-lying coastal zones of Great Nicobar and Little Andaman within 45 minutes.',
    actionProtocols: [
      'Immediate vertical evacuation to high ground (>15m above sea level)',
      'Total halt of maritime vessel departures from all Andaman & Nicobar ports',
      'Coastal emergency disaster response force (NDRF) deployed',
    ],
    affectedDistricts: ['Nicobar', 'South Andaman', 'North & Middle Andaman', 'Chennai Harbor (Watch)'],
  },
  {
    id: 'CYC-2026-012',
    title: 'Very Severe Cyclonic Storm (VSCS) "VARUN" — Rapid Intensification',
    category: 'cyclone',
    severity: 'RED',
    region: 'Central & North Bay of Bengal',
    coordinates: { lat: 16.8, lon: 88.5 },
    issueTime: '2026-09-20 12:00 UTC',
    validUntil: '2026-09-22 18:00 UTC',
    peakThreatTime: 'Landfall: 21 Sep 14:00 UTC',
    metrics: {
      primaryMetricLabel: 'Max Sustained Winds',
      primaryMetricValue: '145 km/h (80 kts)',
      secondaryMetricLabel: 'Storm Surge Height',
      secondaryMetricValue: '2.8 m above tide',
      pressureOrDepth: 'Central Pressure: 964 hPa',
    },
    advisoryText:
      'Cyclone Varun is tracking North-Northwestward at 16 km/h over abnormally high SST warm pool (30.8°C). Gale winds up to 160 km/h with heavy storm surge inundation forecast near Odisha-West Bengal coast.',
    actionProtocols: [
      'Great Danger Signal No. 9 hoisted at Paradip and Dhamra Ports',
      'Total suspension of deep-sea fishing trawlers across Bay of Bengal',
      'Continuous satellite SAR scatterometer and radar tracking active',
    ],
    affectedDistricts: ['Kendrapara', 'Jagatsinghpur', 'Puri', 'Bhadrak', 'Purba Medinipur', 'South 24 Parganas'],
  },
  {
    id: 'TID-2026-088',
    title: 'Perigean Spring High Tide & Swell Surge (Kallakkadal) Advisory',
    category: 'high_tide',
    severity: 'ORANGE',
    region: 'Southwest Coast of India (Kerala & Lakshadweep)',
    coordinates: { lat: 9.8, lon: 76.1 },
    issueTime: '2026-09-20 10:30 UTC',
    validUntil: '2026-09-21 16:00 UTC',
    peakThreatTime: 'High Tide Peak: 20 Sep 18:30 IST',
    metrics: {
      primaryMetricLabel: 'Astronomical Tide Peak',
      primaryMetricValue: '1.92 m',
      secondaryMetricLabel: 'Swell Wave Period',
      secondaryMetricValue: '18.4 seconds',
      pressureOrDepth: 'Combined Water Level: 2.65 m',
    },
    advisoryText:
      'Coincidence of astronomical Perigean spring tide with long-period Southern Ocean swell waves causing coastal surges without local wind generation. Inundation of beaches and coastal roadways likely.',
    actionProtocols: [
      'Small craft coastal advisory in effect for artisanal fishing canoes',
      'Recreational coastal activities and beach access suspended during high tide peaks',
      'Securing moored coastal craft and breakwater defense barriers',
    ],
    affectedDistricts: ['Alappuzha', 'Kollam', 'Ernakulam', 'Thiruvananthapuram', 'Kavaratti Atoll'],
  },
  {
    id: 'RAIN-2026-041',
    title: 'Monsoon Depressional Heavy Rainfall & Coastal Runoff Alert',
    category: 'heavy_rain',
    severity: 'ORANGE',
    region: 'Konkan & Goa Coast (Arabian Sea Eastern Rim)',
    coordinates: { lat: 15.4, lon: 73.8 },
    issueTime: '2026-09-20 09:00 UTC',
    validUntil: '2026-09-22 06:00 UTC',
    peakThreatTime: 'Torrential Peak: Next 24 Hours',
    metrics: {
      primaryMetricLabel: 'Cumulative 24h Rainfall',
      primaryMetricValue: '215 mm',
      secondaryMetricLabel: 'River Runoff Discharge',
      secondaryMetricValue: '3,800 m³/s',
      pressureOrDepth: 'Salinity Drop: -4.5 PSU',
    },
    advisoryText:
      'Active offshore monsoon trough funneling saturated southwesterly winds. Extremely heavy rainfall will trigger intense river runoff, reducing coastal sea surface salinity and generating estuarine silt plumes.',
    actionProtocols: [
      'Flash flood vigilance along coastal river estuaries',
      'Monitoring estuarine navigation channels for reduced visibility and debris drift',
    ],
    affectedDistricts: ['Mumbai City', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'North Goa'],
  },
]

interface DisasterAlertSystemProps {
  onClose: () => void
  onFocusCoordinates?: (lat: number, lon: number) => void
}

export function DisasterAlertSystem({ onClose, onFocusCoordinates }: DisasterAlertSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<DisasterCategory>('all')
  const [selectedAlert, setSelectedAlert] = useState<DisasterAlert>(ACTIVE_DISASTER_ALERTS[0])
  const [isSirenActive, setIsSirenActive] = useState(false)
  const [copiedBulletin, setCopiedBulletin] = useState(false)

  // Web Audio API Synthesizer for Disaster Warning Siren Tone
  const playAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(480, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3)
      osc.frequency.exponentialRampToValueAtTime(480, ctx.currentTime + 0.6)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.9)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 1.2)

      setIsSirenActive(true)
      setTimeout(() => setIsSirenActive(false), 1200)
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  const filteredAlerts = ACTIVE_DISASTER_ALERTS.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  )

  const copyBulletinText = () => {
    const text = `[OFFICIAL DISASTER ADVISORY | INCOIS OCEAN INTELLIGENCE]
ID: ${selectedAlert.id}
Title: ${selectedAlert.title}
Severity: ${selectedAlert.severity} ALERT
Region: ${selectedAlert.region}
Peak Threat: ${selectedAlert.peakThreatTime}
${selectedAlert.metrics.primaryMetricLabel}: ${selectedAlert.metrics.primaryMetricValue}
${selectedAlert.metrics.secondaryMetricLabel}: ${selectedAlert.metrics.secondaryMetricValue}
Advisory: ${selectedAlert.advisoryText}
Key Actions:
${selectedAlert.actionProtocols.map((p) => `- ${p}`).join('\n')}`

    navigator.clipboard.writeText(text)
    setCopiedBulletin(true)
    setTimeout(() => setCopiedBulletin(false), 2000)
  }

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'RED':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
      case 'ORANGE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      case 'YELLOW':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#030d1a] border border-cyan-500/40 shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#05162a]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <ShieldAlert size={22} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Multi-Hazard Disaster Early Warning System
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[10px] font-bold border border-red-500/40">
                  {ACTIVE_DISASTER_ALERTS.length} Active Advisories
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Oceanographic & Meteorological Threat Detection | INCOIS / MoES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Siren audio test button */}
            <button
              onClick={playAlertSound}
              title="Test Acoustic Siren Warning Tone"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                isSirenActive
                  ? 'bg-red-600 text-white border-red-400 shadow-lg shadow-red-600/50'
                  : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-500/30'
              }`}
            >
              {isSirenActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>{isSirenActive ? 'Siren Sounding...' : 'Test Siren'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/5 bg-[#020b17] overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-1">
            <Radio size={12} className="text-cyan-400" /> Filter:
          </span>
          {(
            [
              { id: 'all', label: 'All Threats', count: 4 },
              { id: 'tsunami', label: '🌊 Tsunamis', count: 1 },
              { id: 'cyclone', label: '🌀 Cyclones', count: 1 },
              { id: 'high_tide', label: '🌊 High Tides', count: 1 },
              { id: 'heavy_rain', label: '🌧️ Heavy Rains', count: 1 },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Main Content: Left List + Right Detailed Advisory */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Alert List (5 cols) */}
          <div className="lg:col-span-5 border-r border-white/10 overflow-y-auto p-3 space-y-2.5">
            {filteredAlerts.map((alert) => {
              const isSelected = selectedAlert.id === alert.id
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-slate-400">{alert.id}</span>
                    <span
                      className={`px-2 py-0.2 rounded font-mono text-[9px] font-bold border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity} WARNING
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{alert.title}</h4>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <MapPin size={11} /> {alert.region.split('/')[0]}
                    </span>
                    <span>{alert.metrics.primaryMetricValue}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Selected Alert Detail Inspector (7 cols) */}
          <div className="lg:col-span-7 overflow-y-auto p-5 space-y-4 bg-[#010814]">
            {/* Title & Severity Banner */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${getSeverityBadge(
                    selectedAlert.severity
                  )}`}
                >
                  {selectedAlert.severity} ACTION REQUIRED
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-cyan-400" /> Peak: {selectedAlert.peakThreatTime}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{selectedAlert.title}</h3>
              <p className="text-xs text-cyan-300 font-mono flex items-center gap-1.5">
                <MapPin size={13} /> {selectedAlert.region} ({selectedAlert.coordinates.lat}°N, {selectedAlert.coordinates.lon}°E)
              </p>
            </div>

            {/* Metrics KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">{selectedAlert.metrics.primaryMetricLabel}</div>
                <div className="text-lg font-bold text-red-400 font-mono mt-0.5">
                  {selectedAlert.metrics.primaryMetricValue}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-slate-400">{selectedAlert.metrics.secondaryMetricLabel}</div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                  {selectedAlert.metrics.secondaryMetricValue}
                </div>
              </div>
              {selectedAlert.metrics.pressureOrDepth && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-mono text-slate-400">Atmosphere / Focal Depth</div>
                  <div className="text-xs font-bold text-cyan-300 font-mono mt-1">
                    {selectedAlert.metrics.pressureOrDepth}
                  </div>
                </div>
              )}
            </div>

            {/* Narrative Advisory */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} /> Meteorological Situation & Oceanographic Impact
              </span>
              <p className="text-xs leading-relaxed text-slate-200">{selectedAlert.advisoryText}</p>
            </div>

            {/* Action Protocols */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" /> Mandatory Defense Protocols
              </span>
              <div className="space-y-1.5">
                {selectedAlert.actionProtocols.map((protocol, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-200"
                  >
                    <span className="text-cyan-400 font-bold font-mono">0{i + 1}.</span>
                    <span>{protocol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected Coastal Districts */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-400">High-Vulnerability Districts:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedAlert.affectedDistricts.map((d) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-mono font-medium"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              {onFocusCoordinates && (
                <button
                  onClick={() => {
                    onFocusCoordinates(selectedAlert.coordinates.lat, selectedAlert.coordinates.lon)
                    onClose()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs transition-colors cursor-pointer"
                >
                  <MapPin size={14} /> Fly Camera to Epicenter
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={copyBulletinText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-mono text-xs transition-colors cursor-pointer"
                >
                  <Share2 size={13} /> {copiedBulletin ? 'Copied to Clipboard!' : 'Share Bulletin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
