/**
 * UserManualPage.tsx — Complete Bit-by-Bit OceanIQ & Official INCOIS Apps Guide
 * Route: /manual and /guide
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Provides:
 * Part 1: Bit-by-bit User Manual for all OceanIQ workstation tools & features
 * Part 2: Step-by-step guidance for official INCOIS websites, mobile apps, and data services
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Globe,
  Waves,
  Layers,
  Sparkles,
  BarChart2,
  FileSpreadsheet,
  Upload,
  Radio,
  Activity,
  Compass,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  ShieldAlert,
  Database,
  ArrowRight,
  Fish,
  Zap,
  Info,
} from 'lucide-react'

type GuideTab = 'workstation' | 'incois_apps' | 'devices' | 'faq'

export function UserManualPage() {
  const [activeTab, setActiveTab] = useState<GuideTab>('workstation')

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#010610] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-5 py-4 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <BookOpen size={20} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                OceanIQ User Manual & Official INCOIS Guide
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  INCOIS Platform
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Bit-by-bit platform walkthrough, operational tutorials, and official INCOIS mobile app guides
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <span>Open 3D Explorer</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </header>

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-[#020914] px-5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <button
          onClick={() => setActiveTab('workstation')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workstation'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Globe size={14} />
          <span>Part 1: OceanIQ Workstation Manual</span>
        </button>

        <button
          onClick={() => setActiveTab('incois_apps')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'incois_apps'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Smartphone size={14} />
          <span>Part 2: Official INCOIS Apps & Websites Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'devices'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Radio size={14} />
          <span>Part 3: In-Situ Sensor Suite Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'faq'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <HelpCircle size={14} />
          <span>Quick FAQs & Troubleshooting</span>
        </button>
      </div>

      {/* ── Content Body ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto p-5 sm:p-8 space-y-8 flex-1 w-full">
        {/* ══════════ TAB 1: OceanIQ Workstation Manual ══════════ */}
        {activeTab === 'workstation' && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
                <Sparkles size={15} />
                <span>OceanIQ Digital Twin Workstation</span>
              </div>
              <h2 className="text-xl font-bold text-white font-sans">
                Mastering the 3D Indian Ocean Intelligence Platform
              </h2>
              <p className="text-slate-300 text-xs font-mono leading-relaxed max-w-4xl">
                OceanIQ renders high-resolution 3D volumetric oceanography, real-time observational feeds,
                dynamic streamlines, and AI threat detection. Below is the bit-by-bit operational guide
                to using every button, layer, tool, and inspector across the platform.
              </p>
            </div>

            {/* Getting Started: Login & Access */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">
                <CheckCircle2 size={15} />
                <span>Getting Started · Platform Access</span>
              </div>
              <h3 className="text-base font-bold text-white font-sans">Step 0 — Login &amp; User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-xs font-bold text-emerald-300 font-mono">1. Access the Login Page</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Navigate to the platform URL. If not logged in, you will be automatically redirected to the OceanIQ Access Portal.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-xs font-bold text-emerald-300 font-mono">2. Fill Your Profile</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Enter your <strong className="text-white">Full Name</strong>, <strong className="text-white">Email Address</strong>, and select your <strong className="text-white">Designation / Role</strong> (e.g., Research Scientist, Disaster Management Officer).</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-xs font-bold text-emerald-300 font-mono">3. Session Persistence</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Your profile is saved in the browser. You stay logged in across sessions until you click <strong className="text-white">Logout</strong> in the top navigation bar.</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 1: Globe Controls */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">1</span>
                  <h3>3D Globe & Space Lightning Navigation</h3>
                </div>
                <ul className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <li>• <strong className="text-white">Rotate:</strong> Click and drag with Left Mouse Button to orbit the Earth in 3D.</li>
                  <li>• <strong className="text-white">Zoom:</strong> Use Mouse Scroll Wheel or trackpad pinch to zoom into coastal straits and deep trenches.</li>
                  <li>• <strong className="text-white">Pan:</strong> Hold Right Mouse Button or Shift + Left Click to pan laterally.</li>
                  <li>• <strong className="text-white">Lightning Background:</strong> Cinematic electric discharge arcs and ionized atmospheric glow illuminate the globe's silhouette in real time.</li>
                  <li>• <strong className="text-white">Home View:</strong> Click the Compass or "Home" button in the controls dock to re-center on the Indian Ocean basin.</li>
                </ul>
              </div>

              {/* Step 2: Parameter Buttons */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                  <h3>Parameter Switching & Dynamic Layers</h3>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  Click any top parameter pill to instantly update the 3D globe texture, colorbar scale, and active animation layers:
                </p>
                <ul className="text-xs font-mono text-slate-300 space-y-1.5 leading-relaxed">
                  <li>• <strong className="text-orange-400">Temperature (°C):</strong> Visualizes SST and subsurface isotherms; highlights marine heatwaves.</li>
                  <li>• <strong className="text-blue-400">Salinity (PSU):</strong> Reveals Arabian Sea evaporation cores (&gt;36.5 PSU) vs Bay of Bengal riverine freshening (&lt;32 PSU).</li>
                  <li>• <strong className="text-purple-400">Current Velocity (m/s):</strong> Auto-activates particle streamlines along the Somali Jet, Wyrtki Jet, and coastal flows.</li>
                  <li>• <strong className="text-cyan-400">Sea Level (SSHA cm):</strong> Displays 3D altimetric sea surface height anomalies with animated undulating waves.</li>
                  <li>• <strong className="text-emerald-400">Chlorophyll-a (mg/m³):</strong> Activates photosynthetic phytoplankton blooms and Potential Fishing Zone (PFZ) fish schools.</li>
                </ul>
              </div>

              {/* Step 3: 4D Depth & Timeline */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">3</span>
                  <h3>4D Depth Slider & Forecast Timeline</h3>
                </div>
                <ul className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <li>• <strong className="text-white">Depth Selector:</strong> Drag the depth slider at the bottom left to slice through water columns from <strong className="text-cyan-300">0m (Surface)</strong> down to <strong className="text-cyan-300">2000m (Bathypelagic)</strong>.</li>
                  <li>• <strong className="text-white">Vertical CTD Profiling:</strong> Click any in-situ float or clicked model point to inspect the vertical stratification curve.</li>
                  <li>• <strong className="text-white">Time Timeline:</strong> Play or scrub across 6-hourly model steps. Time-series vectors and temperatures update dynamically.</li>
                </ul>
              </div>

              {/* Step 4: AI Copilot */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">4</span>
                  <h3>Autonomous AI Copilot & Website Operator</h3>
                </div>
                <ul className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <li>• Click the <strong className="text-cyan-300">AI Copilot</strong> button in the Navbar or bottom-right launcher from any page.</li>
                  <li>• <strong className="text-white">Voice & Text Commands:</strong> Type natural commands like <em>"Switch to Light theme"</em>, <em>"Show fish and plankton"</em>, <em>"Open Graph Builder"</em>, or <em>"Explain Marine Heatwaves"</em>.</li>
                  <li>• <strong className="text-white">Executable Action Chips:</strong> Click action chips to automatically navigate pages, toggle layers, or export datasets without manual searching.</li>
                </ul>
              </div>

              {/* Step 5: Excel Export & Graph Builder */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">5</span>
                  <h3>Excel Creation & Interactive Graph Builder</h3>
                </div>
                <ul className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <li>• On the <Link to="/observations" className="text-cyan-400 underline font-bold">Observations Page</Link>, click <strong className="text-white">Export Dataset</strong> to download in-situ tables in formatted <strong className="text-emerald-400">Excel (.xlsx)</strong>, CSV, or JSON.</li>
                  <li>• Click <strong className="text-white">Create Custom Graph</strong> to open the interactive Graph Builder.</li>
                  <li>• Pick your X-axis (Depth, Latitude, Longitude) and Y-axis (Temperature, Salinity, Velocity, Chlorophyll) and toggle Line, Bar, Area, or Scatter chart types.</li>
                </ul>
              </div>

              {/* Step 6: Data Ingestion & Model Validation */}
              <div className="p-5 rounded-2xl bg-[#030d1a] border border-white/10 space-y-3 hover:border-cyan-400/40 transition-all">
                <div className="flex items-center gap-2.5 text-cyan-300 font-mono text-sm font-bold">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">6</span>
                  <h3>Universal Ingestion & Model Validation</h3>
                </div>
                <ul className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <li>• Open the <Link to="/data" className="text-cyan-400 underline font-bold">Data Hub</Link> and launch the 5-step <strong className="text-white">Universal Ingestion Wizard</strong> to upload your own CSV, TSV, NetCDF, or GeoJSON files.</li>
                  <li>• Navigate to <Link to="/compare" className="text-cyan-400 underline font-bold">Model vs Observation Validation</Link> to run automated spatiotemporal point matching.</li>
                  <li>• Compute RMSE, Mean Absolute Error (MAE), and bias classifications against INCOIS numerical forecast models.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB 2: Official INCOIS Apps & Websites ══════════ */}
        {activeTab === 'incois_apps' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
                <Smartphone size={15} />
                <span>Ministry of Earth Sciences (MoES) — ESSO-INCOIS</span>
              </div>
              <h2 className="text-xl font-bold text-white font-sans">
                Official INCOIS Portals, Mobile Apps & Operating Procedures
              </h2>
              <p className="text-slate-300 text-xs font-mono leading-relaxed max-w-4xl">
                The Indian National Centre for Ocean Information Services (INCOIS) in Hyderabad operates
                India's premier operational oceanography services. This comprehensive manual details how to
                access, install, and interpret services provided across official INCOIS applications and portals.
              </p>
            </div>

            {/* INCOIS Services Cards */}
            <div className="space-y-6">
              {/* 1. SAMUDRA App & Portal */}
              <div className="p-6 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                      <Smartphone size={22} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        1. INCOIS SAMUDRA Mobile App & Web Portal
                      </h3>
                      <span className="text-xs font-mono text-cyan-400">
                        Smart Access to Marine Users for Data Resources and ocean Advisories
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://samudra.incois.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <span>Visit samudra.incois.gov.in</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Purpose & Beneficiaries</span>
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Designed for traditional fishermen, maritime operators, coastal tourism, Indian Coast Guard,
                      and port authorities. Delivers daily Ocean State Forecasts (OSF) in 10 coastal languages.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-cyan-400" />
                      <span>Key Information Delivered</span>
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Significant Wave Height (SWH), swell wave periods, ocean currents, surface winds,
                      Potential Fishing Zone (PFZ) coordinates, and High Wave & Swell Surge Alert advisories.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-amber-400" />
                      <span>How to Install & Use</span>
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Download "SAMUDRA" from Google Play Store. Enable location access to get automatic
                      hyperlocal coastal weather and danger alerts. Works in both online mode and cached offline mode.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Potential Fishing Zone (PFZ) Advisories */}
              <div className="p-6 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      <Fish size={22} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        2. Potential Fishing Zone (PFZ) Advisory Services
                      </h3>
                      <span className="text-xs font-mono text-amber-400">
                        Satellite-guided fish aggregation forecasting for Indian fishers
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://incois.gov.in/portal/pfz/pfz.jsp"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <span>INCOIS PFZ Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-3 leading-relaxed">
                  <p>
                    <strong className="text-white">Scientific Principle:</strong> Pelagic fish like Yellowfin Tuna,
                    Indian Mackerel, and Sardines congregate near oceanic thermal fronts where nutrient-rich upwelling
                    supports dense phytoplankton blooms. INCOIS overlays Sea Surface Temperature (SST) thermal boundaries
                    with ocean color Chlorophyll-a from Oceansat/MODIS satellites to locate these zones.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <strong className="text-amber-300 block">How Fishers Access Advisories:</strong>
                      <span className="text-slate-400">
                        Via SAMUDRA App, Electronic Display Boards (EDBs) at fishing harbors, SMS alerts,
                        and Community Radio broadcasts every day at 08:00 IST.
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <strong className="text-emerald-300 block">Documented Economic Impact:</strong>
                      <span className="text-slate-400">
                        Reduces search time by 30% to 70% and saves over ₹15,000 to ₹35,000 in diesel
                        fuel per fishing excursion with 2x to 4x higher catch per unit effort.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Tsunami Early Warning Centre (ITEWC) */}
              <div className="p-6 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-red-500/15 text-red-300 border border-red-400/30">
                      <ShieldAlert size={22} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        3. Indian Ocean Tsunami Early Warning Centre (ITEWC)
                      </h3>
                      <span className="text-xs font-mono text-red-400">
                        24x7 real-time seismic detection, deep-sea BPRs, and coastal alert dissemination
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://incois.gov.in/portal/tsunami/tsunami.jsp"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-mono font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <span>ITEWC Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Established after the 2004 Indian Ocean tsunami, ITEWC operates as the UNESCO designated
                    Tsunami Service Provider (TSP) for 28 Indian Ocean Rim countries.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-red-300 block mb-1">10-Minute Response:</strong>
                      <span className="text-slate-400">
                        Detects undersea earthquakes (M &gt; 6.5) and generates first threat assessment bulletins within 10 minutes.
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-red-300 block mb-1">Bottom Pressure Recorders:</strong>
                      <span className="text-slate-400">
                        Deep ocean tsunameter buoys (BPRs) detect millimeter-scale wave amplitude changes in the open ocean.
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                      <strong className="text-red-300 block mb-1">Multi-Channel Alerts:</strong>
                      <span className="text-slate-400">
                        Direct automated sirens, GTS, NDMA emergency gateways, email/SMS, and fax alerts to coastal authorities.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. INCOIS Live Access Server (LAS) & Argo GDAC */}
              <div className="p-6 rounded-2xl bg-[#030d1a] border border-white/10 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/30">
                      <Database size={22} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">
                        4. INCOIS Live Access Server (LAS) & Indian Argo GDAC
                      </h3>
                      <span className="text-xs font-mono text-purple-400">
                        Scientific NetCDF data query, OPeNDAP services, and profiling float records
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href="https://las.incois.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all border border-white/15"
                    >
                      <span>INCOIS LAS</span>
                      <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://incois.gov.in/argo/argo.jsp"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all"
                    >
                      <span>Indian Argo Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-white">How Researchers Use LAS & Argo:</strong>
                  </p>
                  <ul className="space-y-1 text-slate-400">
                    <li>• Select spatial bounding boxes (e.g. 40°E–100°E, 30°S–30°N) to subset multi-gigabyte models without downloading full datasets.</li>
                    <li>• Access CF-compliant OPeNDAP endpoints directly into Python (`xarray`, `netCDF4`) or MATLAB.</li>
                    <li>• Download quality-controlled Argo float profiles with temperature, salinity, and biogeochemical (BGC) measurements down to 2,000m.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB 3: In-Situ Sensor Suite Catalog ══════════ */}
        {activeTab === 'devices' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 shadow-xl space-y-2">
              <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2">
                <Radio className="text-emerald-400" size={20} />
                <span>INCOIS Ocean Observation Network (OON) Device Suite</span>
              </h2>
              <p className="text-xs text-slate-300 font-mono max-w-3xl">
                Every in-situ device type active in the Indian Ocean has a custom 3D representation and telemetry
                inspector on the OceanIQ platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Argo */}
              <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-sm">Argo Profiling Floats</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">Deep 2000m</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Autonomous buoyancy-driven floats that sink to 1,000m drift depth, descend to 2,000m, and rise
                  to the surface every 10 days measuring temperature and salinity, transmitting data via satellite.
                </p>
              </div>

              {/* Gliders */}
              <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-sm">Autonomous Underwater Gliders</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Sawtooth Trajectory</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Winged AUVs performing high-resolution sawtooth transects between surface and 1,000m depth, measuring
                  pycnocline shears and internal waves.
                </p>
              </div>

              {/* OMNI */}
              <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-sm">Moored OMNI Buoys</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">Met & Oceanographic</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Heavy moored surface buoys (BD08, BD09, AD02, CB01) measuring wind, radiation, air pressure,
                  and subsurface currents via ADCP and CTD inductive cables.
                </p>
              </div>

              {/* Wave Rider */}
              <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 text-sm">Coastal Wave Rider Buoys (WRBs)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/30">Directional Waves</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Spherical accelerometer-equipped buoys deployed along Kochi, Puducherry, Gopalpur, Digha, and Veraval
                  measuring wave height, wave period, and wave direction every 30 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB 4: FAQs ══════════ */}
        {activeTab === 'faq' && (
          <div className="space-y-4 animate-fade-in font-mono text-xs">
            <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
              <strong className="text-white text-sm block">Q: How do I switch to the new Light Theme?</strong>
              <p className="text-slate-400 leading-relaxed">
                Click the theme picker in the top right of the Navbar (the palette icon) and choose "Maritime Light".
                The entire workstation will transform into a high-contrast, clean academic daylight theme.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
              <strong className="text-white text-sm block">Q: How do I export data to Excel or create charts?</strong>
              <p className="text-slate-400 leading-relaxed">
                Go to the Observations page or Data Hub. Click "Export Dataset" to download an Excel sheet with all platform
                measurements, or click "Create Custom Graph" to plot parameters against depth or coordinates.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#030d1a] border border-white/10 space-y-2">
              <strong className="text-white text-sm block">Q: Can I use the AI Copilot to control the website?</strong>
              <p className="text-slate-400 leading-relaxed">
                Yes! The AI Copilot is an autonomous website operator. You can tell it to "Switch to Light theme",
                "Show fish migration", "Open Graph Builder", or "Navigate to Model Validation", and it will execute the action instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
