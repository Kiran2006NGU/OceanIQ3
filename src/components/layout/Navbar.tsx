/**
 * Navbar.tsx — Clean Scientific Navigation Bar
 * OceanIQ — Indian Ocean 3D Intelligence Platform | INCOIS / MoES
 *
 * Includes:
 * - Streamlined 5 primary scientific workspaces
 * - "More" resource dropdown for Data Hub, Diagnostics, Providers, and Docs
 * - 1-Click Multi-Theme Switcher (🌙 Dark / ☀️ Light / 🛰️ Tactical)
 * - 1-Click User Role Switcher (👤 Citizen / 🔬 Scientist / 🛡️ Operator)
 * - User Profile chip with logout
 */

import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { APP_CONFIG, PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/config'
import { useUserRole } from '@/context/UserRoleContext'
import { useChatbot } from '@/context/ChatbotContext'
import { cn } from '@/utils/cn'
import { ThemePicker } from '@/components/ui/ThemePicker'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Waves,
  Globe,
  Radio,
  Scale,
  ShieldAlert,
  Cpu,
  Database,
  Activity,
  Network,
  BookOpen,
  Compass,
  ChevronDown,
  Menu,
  X,
  Bot,
  LogOut,
  User,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe size={14} />,
  radio: <Radio size={14} />,
  scale: <Scale size={14} />,
  'shield-alert': <ShieldAlert size={14} />,
  cpu: <Cpu size={14} />,
  database: <Database size={14} />,
  activity: <Activity size={14} />,
  network: <Network size={14} />,
  'book-open': <BookOpen size={14} />,
  compass: <Compass size={14} />,
}

export function Navbar() {
  const { roleInfo, cycleRole } = useUserRole()
  const { openChatbot } = useChatbot()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#030d1a]/95 backdrop-blur-md shadow-md flex-shrink-0">
      <nav className="mx-auto flex h-13 max-w-screen-2xl items-center justify-between px-3 lg:px-5">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white no-underline group flex-shrink-0"
          aria-label="OceanIQ Home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-950/50 group-hover:scale-105 transition-all">
            <Waves className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-white font-sans">{APP_CONFIG.shortName}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-semibold">
                INCOIS 3D
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono hidden sm:inline -mt-0.5">
              Digital Twin Workstation
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all border',
                  isActive
                    ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-200 font-bold shadow-sm shadow-cyan-900/40'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/5'
                )
              }
            >
              <span className="opacity-80">{ICON_MAP[item.icon] ?? null}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Direct User Manual Link */}
          <NavLink
            to="/manual"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium transition-all border',
                isActive
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 font-bold'
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )
            }
          >
            <BookOpen size={13} className="text-amber-400" />
            <span>User Manual</span>
          </NavLink>

          {/* Secondary "More Tools" Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium transition-all border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200',
                moreOpen && 'bg-white/5 text-white border-white/10'
              )}
            >
              <span>More</span>
              <ChevronDown size={12} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#030d1a] border border-white/15 shadow-2xl p-1.5 z-50 animate-fade-in font-mono text-xs">
                {SECONDARY_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-cyan-400">{ICON_MAP[item.icon] ?? null}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: AI Copilot + Role Switcher + Theme Switcher + Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* AI Copilot trigger */}
          <button
            onClick={openChatbot}
            title="Open OceanIQ AI Copilot (Natural Language Site Operator)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/40 text-xs font-mono text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Bot size={14} className="text-cyan-400" />
            <span className="hidden sm:inline font-bold">AI Copilot</span>
          </button>

          {/* User Role Switcher */}
          <button
            onClick={cycleRole}
            title={`Active Role: ${roleInfo.label} — ${roleInfo.description} (Click to switch)`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-all cursor-pointer"
          >
            <span>{roleInfo.icon}</span>
            <span className="hidden sm:inline font-bold text-cyan-300">{roleInfo.badge}</span>
          </button>

          {/* Theme Picker (dropdown with 6 themes) */}
          <ThemePicker />

          {/* User Profile chip */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
              <User size={12} className="text-cyan-400 flex-shrink-0" />
              <span className="text-slate-300 max-w-[80px] truncate" title={user.name}>{user.name}</span>
              <button
                onClick={() => { logout(); navigate('/login', { replace: true }) }}
                title="Logout"
                className="ml-1 p-0.5 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut size={11} />
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#030d1a] p-3 space-y-1 font-mono text-xs animate-fade-in">
          {[...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <span className="text-cyan-400">{ICON_MAP[item.icon] ?? null}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
