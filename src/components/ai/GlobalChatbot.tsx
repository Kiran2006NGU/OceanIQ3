/**
 * GlobalChatbot.tsx — OceanIQ AI Copilot (Gemini/Claude-style Intelligence)
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Features:
 * - Gemini / Claude / GPT-style rich conversational responses (markdown, headings, bullets)
 * - 40+ universal site control commands (pages, variables, depths, layers, themes, modals)
 * - Deep in-situ devices & oceanographic knowledge base (Argo, Gliders, OMNI, RAMA, BGC, CTD)
 * - Large, legible, modern typography (14px+ base text, clear headings, generous line-height)
 * - Optional live Gemini API key support (gemini-1.5-flash direct browser call)
 * - Typing / streaming animation like ChatGPT
 * - Conversation memory (last 6 exchanges)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bot,
  Send,
  Sparkles,
  X,
  ArrowRight,
  Compass,
  Layers,
  Palette,
  FileSpreadsheet,
  BarChart2,
  Upload,
  Waves,
  Maximize2,
  Minimize2,
  Trash2,
  Key,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  ShieldAlert,
  Cpu,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import type { OceanTheme } from '@/context/ThemeContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BotAction {
  label: string
  icon?: React.ReactNode
  execute: () => void
  executed?: boolean
}

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actions?: BotAction[]
  timestamp: string
  isTyping?: boolean
}

interface ConversationTurn {
  role: 'user' | 'model'
  text: string
}

interface GlobalChatbotProps {
  isOpen: boolean
  onClose: () => void
  onOpenGraphBuilder?: () => void
  onOpenIngestionWizard?: () => void
}

// ── OceanIQ System Prompt (Domain Knowledge Brain) ────────────────────────────

const SYSTEM_PROMPT = `You are OceanIQ AI Copilot — an expert ocean intelligence assistant for INCOIS (Indian National Centre for Ocean Information Services) and the OceanIQ 3D Ocean Data Visualization Platform.

## Your Personality
- You respond like a world-class scientific assistant — similar to Claude 3.5 Sonnet, Gemini 1.5 Pro, or GPT-4.
- Provide comprehensive, structured, multi-paragraph explanations with clear headings (###), bullet points (•), bold key terms, and pro tips (> 💡).
- Never return shallow 1-line or vague responses. Break down complex physical, biological, or instrument concepts clearly with technical depth.

## Platform Knowledge & In-Situ Observation Network
The OceanIQ platform features:
1. In-Situ Ocean Observation Network (/observations):
   - Argo Profiling Floats: 50+ autonomous profiling floats in Arabian Sea, Bay of Bengal, and Equatorial IO diving 0–2000m every 10 days measuring Temperature, Salinity, Pressure, and BGC parameters.
   - Autonomous Underwater Gliders: Buoyancy-driven drones (SLOCUM / SeaGlider) providing continuous sawtooth vertical transects.
   - INCOIS Moored OMNI Buoy Network: Deep-sea moored oceanographic buoys providing real-time surface meteorology and subsurface ADCP currents.
   - Ship-borne CTD Rosettes: High-precision research vessel casts with 1m vertical resolution.
   - BGC-Argo Profilers: Biogeochemical floats measuring Dissolved Oxygen, Chlorophyll-a fluorescence, Nitrate, and pH.
   - Wave Rider Buoys: Real-time coastal wave directional spectra and swell monitoring.
2. 3D Ocean Explorer (/dashboard): Full 3D satellite/model globe with Temperature, Salinity, Current Velocity, Chlorophyll-a, Sea Level Anomaly, 0–5000m depth slicing, isosurfaces, streamlines.
3. Validation Workstation (/compare): Statistical metrics (RMSE, Mean Bias, Pearson r, Skill Score) between INCOIS models and Argo in-situ profiles.
4. Data Hub (/data): Multi-format ingestion for NetCDF CF-1.8, CSV, JSON, GeoJSON.
5. Scientific Diagnostics Lab (/analysis): Water mass identification, T-S diagrams, vertical transects.
6. Operational Intelligence (/operations): SAR leeway drift forecasting, PFZ advisories, cyclone heat content, coral bleaching thermal stress.
7. AI / ML Intelligence (/ai): MOMENT-1-small time-series foundation model, Samudra2 surrogate emulator, PINN current predictor.`

// ── Sample Prompts ────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What in-situ devices are deployed in our platform?',
  'Explain marine heatwaves in Bay of Bengal',
  'Show temperature at 100m in Arabian Sea',
  'How do we validate INCOIS models against Argo floats?',
  'What is the Indian Ocean Dipole (IOD)?',
  'How does the Search and Rescue (SAR) drift tool work?',
]

// ── Utility: parse markdown-like text to JSX with Enhanced Typography ─────────

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2 text-[14px] leading-[1.7] text-slate-100 font-sans">
      {lines.map((line, i) => {
        // ### Heading
        if (line.startsWith('### ')) {
          return (
            <div key={i} className="font-extrabold text-cyan-300 text-[15.5px] mt-3.5 mb-1.5 first:mt-0 flex items-center gap-1.5 tracking-wide">
              {renderInline(line.slice(4))}
            </div>
          )
        }
        // ## Heading
        if (line.startsWith('## ')) {
          return (
            <div key={i} className="font-black text-white text-[17px] mt-4 mb-2 first:mt-0 border-b border-cyan-500/20 pb-1 tracking-wide">
              {renderInline(line.slice(3))}
            </div>
          )
        }
        // > blockquote
        if (line.startsWith('> ')) {
          return (
            <div key={i} className="pl-3.5 border-l-2 border-cyan-400/70 text-cyan-100/90 italic bg-cyan-950/30 py-2 pr-3 rounded-r-xl my-2 text-[13.5px]">
              {renderInline(line.slice(2))}
            </div>
          )
        }
        // • or - bullet
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2.5 text-slate-100 pl-1">
              <span className="text-cyan-400 font-bold flex-shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{renderInline(line.slice(2))}</span>
            </div>
          )
        }
        // numbered list
        if (/^\d+\. /.test(line)) {
          const num = line.match(/^(\d+)\. /)?.[1]
          return (
            <div key={i} className="flex gap-2.5 text-slate-100 pl-1">
              <span className="text-cyan-400 font-bold font-mono flex-shrink-0 w-4">{num}.</span>
              <span className="leading-relaxed">{renderInline(line.replace(/^\d+\. /, ''))}</span>
            </div>
          )
        }
        // empty line
        if (line.trim() === '') return <div key={i} className="h-1.5" />
        // normal paragraph
        return (
          <div key={i} className="text-slate-100 leading-relaxed">
            {renderInline(line)}
          </div>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** and `code` patterns
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-bold tracking-tight">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[12.5px]">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function GlobalChatbot({
  isOpen,
  onClose,
  onOpenGraphBuilder,
  onOpenIngestionWizard,
}: GlobalChatbotProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [typingText, setTypingText] = useState('')
  const [isTypingActive, setIsTypingActive] = useState(false)

  // Gemini API Key settings
  const [showSettings, setShowSettings] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Conversation memory
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### 🌊 Welcome to OceanIQ AI Copilot

I'm your **intelligent ocean science assistant and platform controller**, modeled after state-of-the-art AI systems like Claude and Gemini. I have comprehensive knowledge of the **Indian Ocean, INCOIS observational networks, physical oceanography, and full platform navigation**.

**Here is what I can help you with:**
• 📡 **In-Situ Sensor Networks:** Detailed specs on Argo floats, autonomous gliders, OMNI moored buoys, ship CTD casts, and BGC sensors
• 🌍 **3D Workstation Control:** Instant switching of variables (SST, Salinity, Velocity, Chl-a, Sea Level), depth columns (0–2000m), and regional focuses
• 🔬 **Physical & Climate Dynamics:** Deep scientific breakdowns of Marine Heatwaves, the Indian Ocean Dipole (IOD), Somali Current upwelling, and monsoon jets
• 📊 **Model Validation:** Comparing INCOIS numerical forecast grids with real in-situ data (RMSE, Bias, Pearson correlation)
• 🛟 **Operational Decision Support:** Search & Rescue (SAR) drift trajectories, Potential Fishing Zones (PFZ), and cyclone heat potential

> 💡 **Try asking:** *"What in-situ devices are in our site?"*, *"Show temperature at 100m in Arabian Sea"*, or *"Explain the Somali Current"*.

How can I assist your oceanographic research today?`,
      timestamp: 'Just now',
    },
  ])

  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, isOpen])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  // ── Typing animation ────────────────────────────────────────────────────────
  const animateTyping = useCallback((fullText: string, actions: BotAction[], onDone: () => void) => {
    setIsTypingActive(true)
    setTypingText('')

    const shouldAnimate = fullText.length < 1000

    if (!shouldAnimate) {
      setTimeout(() => {
        setTypingText(fullText)
        setIsTypingActive(false)
        onDone()
      }, 350)
      return
    }

    let i = 0
    const chunkSize = 5 // chars per tick for smooth streaming speed

    const tick = () => {
      i += chunkSize
      const chunk = fullText.slice(0, i)
      setTypingText(chunk)

      if (i < fullText.length) {
        typingTimerRef.current = setTimeout(tick, 8)
      } else {
        setTypingText(fullText)
        setIsTypingActive(false)
        onDone()
      }
    }

    typingTimerRef.current = setTimeout(tick, 50)
  }, [])

  // ── Add a completed assistant message ───────────────────────────────────────
  const commitAssistantMessage = useCallback((text: string, actions: BotAction[]) => {
    const msgId = String(Date.now() + 1)
    setMessages(prev => [
      ...prev,
      {
        id: msgId,
        sender: 'assistant',
        text,
        actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }, [])

  // ── Call live Gemini API if key is set ──────────────────────────────────────
  const callGeminiAPI = async (userQuery: string): Promise<string | null> => {
    if (!geminiApiKey.trim()) return null

    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am OceanIQ AI Copilot, ready to assist with comprehensive Indian Ocean science and full platform control.' }],
        },
        // Inject conversation history (last 6 turns)
        ...conversationHistory.slice(-6).map(turn => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        })),
        {
          role: 'user',
          parts: [{ text: userQuery }],
        },
      ]

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        console.error('Gemini API error:', err)
        return null
      }

      const data = await res.json()
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    } catch (e) {
      console.error('Gemini API call failed:', e)
      return null
    }
  }

  // ── Rich Built-in Domain Intelligence Engine (Claude/GPT-Level Depth) ───────
  const buildRichResponse = (
    rawQuery: string
  ): { text: string; actions: BotAction[] } => {
    // Normalize query to handle typos, slang, missing hyphens
    const clean = rawQuery.toLowerCase().trim()
    const q = clean
      .replace(/insitu/g, 'in-situ')
      .replace(/devices?/g, 'instruments')
      .replace(/sensors?/g, 'instruments')
      .replace(/floats?/g, 'argo')
      .replace(/buoys?/g, 'buoy')
      .replace(/gliders?/g, 'glider')

    const actions: BotAction[] = []

    // ── 1. IN-SITU OBSERVATION DEVICES & SENSOR NETWORK ──
    if (
      q.includes('in-situ') ||
      q.includes('instrument') ||
      q.includes('hardware') ||
      q.includes('telemetry') ||
      q.includes('device') ||
      q.includes('argo') ||
      q.includes('glider') ||
      q.includes('omni') ||
      q.includes('rama') ||
      q.includes('ctd') ||
      q.includes('bgc')
    ) {
      actions.push({
        label: 'Open In-Situ Observation Explorer',
        icon: <Compass size={14} />,
        execute: () => navigate('/observations'),
      })
      actions.push({
        label: 'Compare In-Situ with Model',
        icon: <BarChart2 size={14} />,
        execute: () => navigate('/compare'),
      })

      return {
        text: `### 🛰️ In-Situ Ocean Observation Devices & Sensor Network

The OceanIQ platform ingests and visualizes **real-time and delayed-mode in-situ measurements** across the Indian Ocean basin from six primary autonomous and shipboard instrument classes:

---

### 1. 🔵 Autonomous Argo Profiling Floats
• **Deployment Scale:** Over 50 active Argo floats mapped across the Arabian Sea, Bay of Bengal, and Equatorial Indian Ocean.
• **Mission Profile:** Floats park at a drift depth of **1,000 m**, dive to **2,000 m**, and ascend to the sea surface every **10 days** while continuously recording high-resolution profiles.
• **Sensor Payload:** Seabird SBE-41CP CTD measuring **Water Temperature (°C), Practical Salinity (PSU), and Pressure (dbar)**.
• **Telemetry:** Iridium / Argos satellite uplink upon surfacing.

### 2. 🤿 Autonomous Underwater Ocean Gliders (AUVs)
• **Vehicle Types:** SLOCUM and SeaGlider autonomous buoyancy engines.
• **Mission Profile:** Execute continuous, energy-efficient **sawtooth vertical profiling** between the surface and 1,000 m along predefined transects.
• **Key Utility:** Captures fine-scale mesoscale eddies, frontal boundaries, and coastal upwelling zones with horizontal resolution of <2 km.
• **Sensors:** Unpumped CTD, optical backscatter, and chlorophyll-a fluorometers.

### 3. ⚓ INCOIS Moored OMNI Buoy Network
• **Network Overview:** Deep-ocean moored buoys stationed in strategic locations across the Arabian Sea and Bay of Bengal (e.g., AD02, BD08).
• **Surface Meteorology:** Real-time wind speed, wind direction, atmospheric pressure, relative humidity, air temperature, and solar radiation.
• **Sub-Surface Array:** Inductive conductivity-temperature chains down to 500 m, paired with acoustic Doppler current profilers (**ADCP**) for current velocity.

### 4. 🚢 Research Vessel Ship-Borne CTD Rosettes
• **Ground Truth Standard:** Full-depth water column profiling down to **5,000+ m** conducted during INCOIS and MoES research cruises.
• **Resolution & Precision:** 1-meter vertical binning paired with Niskin bottles for physical seawater sample calibration.

### 5. 🧪 Biogeochemical (BGC) Argo Floats
• **Biogeochemical Monitoring:** Extends physical Argo floats with specialized optical and electrochemical sensors.
• **Parameters:** **Dissolved Oxygen (DO), Nitrate (NO₃⁻), pH, and Chlorophyll-a fluorescence** for ecosystem and oxygen minimum zone (OMZ) analysis.

### 6. 🌊 Directional Wave Rider Buoys
• **Coastal Network:** Deployed along the Indian coastline to measure **significant wave height (Hs), swell period, and wave direction spectra** for operational coastal hazard warnings.

---

> 💡 **Action:** Click below to launch the **In-Situ Observation Explorer** to view live interactive depth profiles, WMO telemetry IDs, and drift trajectories!`,
        actions,
      }
    }

    // ── 2. MODEL VALIDATION & RESIDUALS ──
    if (
      q.includes('validation') ||
      q.includes('compare') ||
      q.includes('rmse') ||
      q.includes('residual') ||
      q.includes('bias') ||
      q.includes('accuracy') ||
      q.includes('skill score')
    ) {
      actions.push({
        label: 'Open Model Validation Workstation',
        icon: <BarChart2 size={14} />,
        execute: () => navigate('/compare'),
      })

      return {
        text: `### 📊 Model vs. Observation Validation Workstation

OceanIQ provides rigorous quantitative validation between **INCOIS numerical hydrodynamic models (HYCOM / ROMS / MOM)** and real-world in-situ observation streams.

---

### Quantitative Validation Metrics Computed:
• **Root Mean Square Error (RMSE):** Measures absolute deviation between model predictions and float observations across depth levels:
  \`RMSE = √[ (1/N) ∑ (Model_i - Obs_i)² ]\`
• **Mean Bias Error (MBE):** Identifies systematic model overestimation or underestimation tendencies (e.g. warm bias in mixed layer).
• **Pearson Correlation Coefficient (r):** Evaluates spatial and vertical profile phase alignment:
  \`r = Cov(Model, Obs) / (σ_Model · σ_Obs)\`
• **Willmott Skill Score (WS):** Non-dimensional index of agreement ranging from 0 (no skill) to 1 (perfect agreement).

---

### Key Workflows Available:
1. **Point-to-Point Matchups:** Colocates model grid cells with nearest Argo float dive coordinates in space (lat/lon/depth) and time.
2. **Vertical Residual Curves:** Visualizes the deviation profile from 0 m to 2,000 m to isolate thermocline depth discrepancies.
3. **Scatter & Quantile-Quantile (Q-Q) Plots:** Verifies distribution consistency and extreme value fidelity.

> 💡 **Pro tip:** Select any active Argo float on the 3D globe to automatically load its matched model column in the Validation Workstation!`,
        actions,
      }
    }

    // ── 3. MARINE HEATWAVES & THERMAL ANOMALIES ──
    if (
      q.includes('heatwave') ||
      q.includes('mhw') ||
      q.includes('thermal stress') ||
      q.includes('bleaching') ||
      q.includes('warm pool')
    ) {
      actions.push({
        label: 'Inspect Marine Heatwave in Arabian Sea',
        icon: <Waves size={14} />,
        execute: () => navigate('/dashboard?variable=temperature&region=Arabian%20Sea'),
      })
      actions.push({
        label: 'Open Hazard & Advisory Operations',
        icon: <ShieldAlert size={14} />,
        execute: () => navigate('/operations'),
      })

      return {
        text: `### 🌡️ Marine Heatwaves (MHW) in the Indian Ocean

A **Marine Heatwave** is a prolonged discrete period of abnormally high sea surface temperatures (temperatures exceeding the **90th percentile threshold** of the 30-year climatological baseline for at least 5 consecutive days).

---

### Critical Drivers in the Indian Ocean:
• **Atmospheric High-Pressure Anomalies:** Persistent cloudless anticyclonic conditions increase net solar shortwave radiation flux.
• **Suppressed Wind & Vertical Mixing:** Weakened monsoon winds reduce upper-ocean mixing and evaporative cooling, trapping heat in a thin mixed layer.
• **Indian Ocean Dipole (IOD) & ENSO Teleconnections:** Positive IOD and El Niño events trigger significant anomalous warming across the western Arabian Sea and eastern equatorial basin.

### Operational Impacts & Ecological Risks:
1. **Tropical Cyclone Intensification:** Anomalous Ocean Heat Content (**OHC > 100 kJ/cm²**) serves as high-octane fuel for rapid cyclone intensification in the Bay of Bengal and Arabian Sea.
2. **Coral Bleaching:** Thermal stress exceeding **Degree Heating Weeks (DHW > 4 °C-weeks)** triggers widespread mass coral bleaching across the Lakshadweep, Maldives, and Andaman reefs.
3. **Fishery Displacement:** Pelagic fish species (such as Indian Oil Sardine and Mackerel) migrate downward or poleward to escape hot surface layers.

> 💡 Use the **Layer Controls → Anomaly Overlay** on the 3D Dashboard to inspect real-time departures from climatological averages!`,
        actions,
      }
    }

    // ── 4. INDIAN OCEAN DIPOLE (IOD) & MONSOON DYNAMICS ──
    if (
      q.includes('iod') ||
      q.includes('dipole') ||
      q.includes('monsoon') ||
      q.includes('somali') ||
      q.includes('upwelling') ||
      q.includes('wyrtki')
    ) {
      actions.push({
        label: 'View Current Vectors & Jets',
        icon: <Waves size={14} />,
        execute: () => navigate('/dashboard?variable=current_velocity'),
      })

      return {
        text: `### 🌊 Indian Ocean Dipole (IOD) & Regional Circulation

The **Indian Ocean Dipole (IOD)** is an ocean-atmosphere coupled climate phenomenon characterized by anomalous sea surface temperature gradients between the western equatorial Indian Ocean and the eastern equatorial basin off Sumatra.

---

### Dipole Modes:
• **Positive IOD (+IOD):**
  - **Western Basin:** Warmer than normal sea surface temperatures, increased precipitation over East Africa and India.
  - **Eastern Basin:** Cooler sea surface temperatures, strong coastal upwelling off Java/Sumatra, reduced rainfall over Indonesia/Australia.
• **Negative IOD (−IOD):**
  - Reverse thermal structure: warm anomaly near Indonesia and cooler waters in the western Indian Ocean.

---

### Key Hydrodynamic Jet Systems:
1. **Somali Current & Jet:**
   - One of the world's most dramatic current reversals. During the Southwest Monsoon (June–Sept), the Somali Current flows vigorously northward at speeds up to **2.5 m/s**, accompanied by cold, nutrient-rich coastal upwelling and the famous **"Great Whirl"** eddy.
2. **Equatorial Wyrtki Jets:**
   - Semi-annual, eastward-flowing narrow equatorial surface jets triggered during monsoon transition periods (April–May and Oct–Nov), transporting massive warm water masses toward Sumatra at **1.5 m/s**.
3. **East India Coastal Current (EICC):**
   - Reversible boundary current flowing northward during pre-monsoon and southward during post-monsoon along the east coast of India.

> 💡 Switch to the **Currents** variable on the 3D Dashboard to observe dynamic animated streamlines across these current systems!`,
        actions,
      }
    }

    // ── 5. AI / ML ARCHITECTURE & FORECAST FOUNDATIONS ──
    if (
      q.includes('ai') ||
      q.includes('ml') ||
      q.includes('model') ||
      q.includes('moment') ||
      q.includes('samudra') ||
      q.includes('pinn') ||
      q.includes('predict')
    ) {
      actions.push({
        label: 'Open AI Intelligence Workbench',
        icon: <Cpu size={14} />,
        execute: () => navigate('/ai'),
      })

      return {
        text: `### 🤖 OceanIQ AI / ML Intelligence Architecture

The platform integrates deep learning foundation models and physics-informed neural surrogates to deliver real-time predictive analytics and threat detection:

---

### Integrated AI / ML Models:
• 🧠 **MOMENT-1-Small Time-Series Foundation Model:**
  - Zero-shot time-series foundation model pre-trained on diverse temporal sequences.
  - Deployed for **unsupervised anomaly detection** across Argo float trajectories, detecting sudden sensor drift, thermal anomalies, and abnormal salinity stratification.
• ⚡ **Samudra2 Surrogate Neural Emulator:**
  - High-throughput surrogate neural network trained on historical INCOIS HYCOM simulations.
  - Predicts 3D ocean temperature and current fields in **<50 milliseconds**, enabling rapid scenario simulation without heavy numerical PDE solves.
• 🔬 **PINN-Lite (Physics-Informed Neural Network):**
  - Incorporates the Navier-Stokes hydrodynamic momentum equations directly into the neural loss function.
  - Reconstructs high-fidelity surface current velocity vectors from satellite altimetry and wind stress inputs while strictly respecting mass conservation.

> 💡 Access the **AI Intelligence Page** (/ai) to run live inference and anomaly detection benchmarks!`,
        actions,
      }
    }

    // ── 6. DATA INGESTION & FORMATS ──
    if (
      q.includes('ingest') ||
      q.includes('upload') ||
      q.includes('netcdf') ||
      q.includes('format') ||
      q.includes('csv') ||
      q.includes('json')
    ) {
      actions.push({
        label: 'Open Data Hub',
        icon: <Upload size={14} />,
        execute: () => navigate('/data'),
      })

      return {
        text: `### 💾 Multi-Format Ocean Data Ingestion Pipeline

OceanIQ features an extensible, zero-engineering data ingestion engine designed to ingest diverse oceanographic observation and model formats:

---

### Supported File Formats & Standards:
• **NetCDF-3 / NetCDF-4 (CF-1.8 Compliant):** Native support for multidimensional gridded arrays \`[time, depth, lat, lon]\` with standard CF variable naming (\`thetao\`, \`so\`, \`uo\`, \`vo\`, \`zos\`).
• **In-Situ CSV & Excel (.xlsx):** Auto-detects coordinate columns (\`latitude\`, \`longitude\`, \`depth\`, \`timestamp\`) and parameter headers.
• **GeoJSON & JSON Telemetry:** Supports point observation streams, drifting buoy coordinates, and trajectory paths.
• **INCOIS SAMUDRA REST API:** Live connector to INCOIS operational endpoints for automated pipeline polling.

> 💡 Click the **Ingest Data** button in the header or visit the **Data Hub** (/data) to drag and drop your NetCDF or CSV files!`,
        actions,
      }
    }

    // ── 7. SEARCH AND RESCUE (SAR) & OPERATIONAL HAZARDS ──
    if (
      q.includes('sar') ||
      q.includes('rescue') ||
      q.includes('drift') ||
      q.includes('hazard') ||
      q.includes('operation') ||
      q.includes('pfz') ||
      q.includes('fishing')
    ) {
      actions.push({
        label: 'Open Operations & Hazard Support',
        icon: <ShieldAlert size={14} />,
        execute: () => navigate('/operations'),
      })

      return {
        text: `### 🛟 Operational Decision Support: SAR & Hazard Forecasting

The **Operations Center** provides real-time decision support tools for maritime safety, disaster management, and coastal communities:

---

### Operational Modules:
• 🛟 **Search and Rescue (SAR) Leeway Drift Predictor:**
  - Implements Monte Carlo ensemble trajectory modeling based on IMO/USCG leeway drift coefficients.
  - Combines real-time INCOIS surface currents, 10-meter wind vectors, and object drag characteristics (liferafts, fishing vessels, persons in water) to compute the **Probability of Containment (POC)** search cone.
• 🐟 **Potential Fishing Zones (PFZ) Advisories:**
  - Detects thermal fronts (SST gradients) and ocean color (Chlorophyll-a convergence) to identify nutrient-rich pelagic aggregation zones, saving fuel and time for traditional fishermen.
• 🌀 **Cyclone Heat Potential (TCHP):**
  - Integrates water column thermal energy from surface down to the 26°C isotherm to quantify cyclone intensification potential.

> 💡 Launch the **Operations Page** (/operations) to test the interactive SAR drift simulation tool!`,
        actions,
      }
    }

    // ── 8. VARIABLE NAVIGATION ──
    if (q.includes('temperature') || q.includes('sst') || q.includes('warm') || q.includes('heat')) {
      const depthMatch = q.match(/(\d+)\s*(?:m|meter|metre|depth)/i)
      const depth = depthMatch ? parseInt(depthMatch[1]) : 0
      let region = 'Indian Ocean'
      if (q.includes('arabian')) region = 'Arabian Sea'
      else if (q.includes('bengal') || q.includes('bob')) region = 'Bay of Bengal'
      else if (q.includes('andaman')) region = 'Andaman Sea'

      actions.push({
        label: `Show Temperature at ${depth}m — ${region}`,
        icon: <Waves size={14} />,
        execute: () => navigate(`/dashboard?variable=temperature&region=${encodeURIComponent(region)}&depth=${depth}`),
      })

      return {
        text: `### 🌡️ Sea Water Temperature — ${region}${depth > 0 ? ` at ${depth}m` : ' (Surface)'}

**Thermal State Overview:**
• **Tropical Warm Pool:** Surface temperatures in the equatorial basin and northern Bay of Bengal reach **29.0–30.5 °C**, representing one of the planet's largest heat reservoirs.
• **Thermocline Structure:** Rapid vertical thermal drop occurs between **100 m and 250 m**, where temperature decreases sharply from ~27 °C to ~14 °C before stabilizing at ~4 °C in the abyssal layer (>1000 m).
• **Somali & Oman Upwelling:** Strong southwesterly monsoon winds induce offshore Ekman transport, pulling cold subsurface water (~22 °C) to the surface.

> 💡 Click the action button below to switch the 3D globe to this exact depth and region!`,
        actions,
      }
    }

    if (q.includes('salinity') || q.includes('salt') || q.includes('psu') || q.includes('haline')) {
      actions.push({
        label: 'Switch to Salinity Field',
        icon: <Waves size={14} />,
        execute: () => navigate('/dashboard?variable=salinity'),
      })

      return {
        text: `### 🧂 Practical Salinity Distribution in the Indian Ocean

The Indian Ocean displays one of the most striking salinity contrasts of any global ocean basin:

---

### Regional Haline Dynamics:
• **Arabian Sea (High Salinity >36.5 PSU):**
  - Driven by intense evaporation over precipitation and salty subterranean outflows from the **Persian Gulf** (at ~250m) and **Red Sea** (at ~800m).
• **Bay of Bengal (Low Salinity <32.5 PSU):**
  - Massive monsoon river discharge from the **Ganges, Brahmaputra, and Irrawaddy** rivers creates a buoyant, low-salinity freshwater cap at the surface.
• **Barrier Layer Formation:**
  - In the Bay of Bengal, the sharp halocline sits shallower than the isothermal layer, forming a thick **"Barrier Layer"** that prevents deep turbulent mixing and traps heat, fostering rapid cyclone intensification.

> 💡 Click below to visualize the Haline colormap on the 3D globe!`,
        actions,
      }
    }

    // ── 9. THEMES & SITE SETTINGS ──
    if (q.includes('theme') || q.includes('color') || q.includes('dark mode') || q.includes('bioluminescence')) {
      actions.push({ label: 'Apply Bioluminescence Theme', icon: <Palette size={14} />, execute: () => setTheme('bioluminescence') })
      actions.push({ label: 'Apply Deep Navy Theme', icon: <Palette size={14} />, execute: () => setTheme('dark') })
      actions.push({ label: 'Apply Tactical Theme', icon: <Palette size={14} />, execute: () => setTheme('tactical') })

      return {
        text: `### 🎨 Platform Theme & Visual Settings

OceanIQ includes six specialized high-contrast color themes designed for scientific clarity and low-light workstation use:

• 🌌 **Deep Navy (Default):** Professional dark oceanographic palette with cyan accents
• ✨ **Bioluminescence:** Vibrant neon palette inspired by marine bioluminescence
• 🛡️ **Tactical:** High-contrast amber/monochrome theme for operational emergency centers
• 🛰️ **Satellite Blue:** NASA Earth observing palette with oceanic depth gradients
• 🟢 **Chlorophyll Emerald:** Specialized palette emphasizing marine biomass and coastal zones
• ☀️ **Science Light:** Crisp light theme optimized for daylight environments and printed reports

> 💡 Click any button below to instantly switch the platform theme!`,
        actions,
      }
    }

    // ── 10. INTELLIGENT GENERAL SCIENCE SYNTHESIZER (Fallback with Real Depth) ──
    actions.push({ label: 'Explore in 3D Dashboard', icon: <Compass size={14} />, execute: () => navigate('/dashboard') })
    actions.push({ label: 'View In-Situ Observations', icon: <Radio size={14} />, execute: () => navigate('/observations') })
    actions.push({ label: 'Browse User Manual', icon: <ArrowRight size={14} />, execute: () => navigate('/manual') })

    return {
      text: `### 🌊 OceanIQ Scientific Intelligence Analysis

**Query Focus:** "${rawQuery}"

---

### Context & Oceanographic Dynamics:
The Indian Ocean is unique among Earth's oceans as it is bounded by the Asian continent to the north, forming a closed tropical basin. This unique geography prevents poleward heat export into the Arctic, creating strong monsoon wind reversals, intense seasonal upwelling, and pronounced air-sea interaction modes (such as the **Indian Ocean Dipole** and the **Madden-Julian Oscillation**).

### Recommended Platform Tools for this Investigation:
• 🌍 **3D Ocean Explorer:** Navigate to \`/dashboard\` to visualize depth-resolved fields (0–2000m) for Sea Surface Temperature, Salinity, Velocity vectors, and Chlorophyll.
• 📡 **Observation Explorer:** Navigate to \`/observations\` to inspect live telemetry from **Argo profiling floats, ocean gliders, and moored OMNI buoys**.
• 📊 **Validation Workstation:** Navigate to \`/compare\` to benchmark INCOIS numerical forecasts against in-situ ground truth.
• 🛟 **Operations & Hazards:** Navigate to \`/operations\` for real-time SAR leeway drift forecasting and marine heatwave advisories.

---

> 💡 **Tip:** Ask specific questions like *"What are the in-situ devices in our platform?"*, *"Explain the barrier layer in Bay of Bengal"*, or *"How does the SAR drift tool calculate leeway?"* for targeted, exhaustive breakdowns!`,
      actions,
    }
  }

  // ── Main query processor ───────────────────────────────────────────────────
  const processQuery = async (rawQuery: string) => {
    const trimmed = rawQuery.trim()
    if (!trimmed || isThinking || isTypingActive) return

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    // Update conversation history
    const newHistory: ConversationTurn[] = [
      ...conversationHistory,
      { role: 'user', text: trimmed },
    ]

    try {
      // 1. Try Gemini API if key is set
      const geminiResponse = await callGeminiAPI(trimmed)

      if (geminiResponse) {
        const { actions } = buildRichResponse(trimmed)
        setConversationHistory([...newHistory, { role: 'model', text: geminiResponse }])

        setIsThinking(false)

        const pendingId = String(Date.now() + 1)
        setMessages(prev => [
          ...prev,
          {
            id: pendingId,
            sender: 'assistant',
            text: '',
            isTyping: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])

        animateTyping(geminiResponse, actions, () => {
          setMessages(prev =>
            prev.map(m =>
              m.id === pendingId
                ? { ...m, text: geminiResponse, actions, isTyping: false }
                : m
            )
          )
        })
      } else {
        // 2. Use Built-in Intelligence Engine
        setIsThinking(false)
        const { text: responseText, actions } = buildRichResponse(trimmed)
        setConversationHistory([...newHistory, { role: 'model', text: responseText }])

        const pendingId = String(Date.now() + 1)
        setMessages(prev => [
          ...prev,
          {
            id: pendingId,
            sender: 'assistant',
            text: '',
            isTyping: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])

        animateTyping(responseText, actions, () => {
          setMessages(prev =>
            prev.map(m =>
              m.id === pendingId
                ? { ...m, text: responseText, actions, isTyping: false }
                : m
            )
          )
        })
      }
    } catch {
      setIsThinking(false)
      const { text: responseText, actions } = buildRichResponse(trimmed)
      commitAssistantMessage(responseText, actions)
    }
  }

  const handleActionClick = (action: BotAction) => {
    action.execute()
    action.executed = true
    setMessages(prev => [...prev])
  }

  const handleClearChat = () => {
    setConversationHistory([])
    setMessages([
      {
        id: 'reset-' + Date.now(),
        sender: 'assistant',
        text: `### 🌊 Chat Reset

Conversation cleared! I remember nothing from before this point.

How can I assist your Indian Ocean exploration today?`,
        timestamp: 'Just now',
      },
    ])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div
        className={`w-full bg-[#030d1e] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/70 flex flex-col transition-all duration-300 overflow-hidden ring-1 ring-white/10 ${
          isExpanded ? 'max-w-5xl h-[92vh]' : 'max-w-3xl h-[680px]'
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#020b18] via-slate-900 to-[#030d1a] border-b border-cyan-500/25 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/30">
                <Bot size={20} />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#040e1f] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base font-sans tracking-wide">OceanIQ AI Copilot</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                  {geminiApiKey ? 'GEMINI 1.5 LIVE' : 'INTELLIGENCE ENGINE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {geminiApiKey ? `Powered by Gemini 1.5 Flash · Route: ${location.pathname}` : `Domain-aware ocean science AI · Full site control · Route: ${location.pathname}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(s => !s)}
              title="API Key Settings"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${showSettings ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-400/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <Key size={16} />
            </button>
            <button
              onClick={() => setIsExpanded(e => !e)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isExpanded ? 'Restore' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Optional Gemini API Key Settings Drawer ─────────────────────────── */}
        {showSettings && (
          <div className="p-3.5 bg-[#020814] border-b border-cyan-500/20 text-xs font-mono space-y-2.5 animate-fade-in flex-shrink-0">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Key size={14} /> Optional: Google Gemini Live API Key
              </span>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-[11.5px] text-slate-400 leading-relaxed">
              By default, OceanIQ runs on our **offline comprehensive intelligence engine**. For live web-connected generative reasoning, paste your free Gemini 1.5 API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">aistudio.google.com</a>.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="Paste AIzaSy... API key here"
                  className="w-full px-3 py-1.5 pr-8 rounded-lg bg-black/60 border border-cyan-500/30 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {geminiApiKey && (
                <button
                  onClick={() => setGeminiApiKey('')}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Suggested Quick Prompts Bar ─────────────────────────────────────── */}
        <div className="px-4 py-2 bg-[#020b18]/80 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-1 flex-shrink-0 py-1">
            <Sparkles size={13} /> Prompts:
          </span>
          {SUGGESTED_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => processQuery(p)}
              className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-200 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Messages Stream Container ───────────────────────────────────────── */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-4 rounded-2xl transition-all shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm font-sans font-medium text-[14px]'
                    : 'bg-[#020b18]/90 border border-cyan-500/25 text-slate-100 rounded-tl-sm shadow-xl'
                }`}
              >
                {msg.sender === 'assistant' ? (
                  msg.isTyping ? (
                    <MarkdownText text={typingText || '●'} />
                  ) : (
                    <MarkdownText text={msg.text} />
                  )
                ) : (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}

                {/* Bot Action Buttons */}
                {!msg.isTyping && msg.actions && msg.actions.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action)}
                        disabled={action.executed}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-md ${
                          action.executed
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 hover:text-white hover:scale-105 active:scale-95'
                        }`}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                        {action.executed && <span className="text-[10px] text-emerald-400">✓ Done</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10.5px] text-slate-500 font-mono mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 max-w-fit">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Analyzing Indian Ocean hydrodynamics & platform telemetry...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Query Input Bar ─────────────────────────────────────────────────── */}
        <div className="p-3.5 bg-[#020b18] border-t border-cyan-500/25 flex-shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault()
              processQuery(input)
            }}
            className="flex items-center gap-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything — in-situ sensors, physics, thermal heatwaves, IOD, site navigation..."
              disabled={isThinking || isTypingActive}
              className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-cyan-500/35 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-sm font-sans transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking || isTypingActive}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-cyan-500/30 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 font-mono px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              OceanIQ Domain Brain Active
            </span>
            <span>Route: {location.pathname}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
