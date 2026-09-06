/**
 * ThemeContext.tsx — Global Multi-Theme Engine
 * SIH 26067 | OceanIQ — Indian Ocean 3D Intelligence Platform
 *
 * Supported Themes:
 * - 'dark': Deep Ocean Dark (default scientific dark mode)
 * - 'light': Maritime Research Light (clean daylight academic mode)
 * - 'tactical': Satellite High-Contrast (command center obsidian & amber)
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light' | 'tactical' | 'coral' | 'arctic' | 'bioluminescence'
export type OceanTheme = ThemeMode

export interface ThemeMeta {
  id: ThemeMode
  label: string
  icon: string
  description: string
  accent: string   // preview color for swatch
  bg: string       // preview bg for swatch
}

export const THEME_META: ThemeMeta[] = [
  { id: 'dark', label: 'Deep Ocean', icon: '🌙', description: 'Scientific dark mode', accent: '#00caf0', bg: '#0a1324' },
  { id: 'light', label: 'Maritime Light', icon: '☀️', description: 'Crisp daylight mode', accent: '#0284c7', bg: '#ffffff' },
  { id: 'tactical', label: 'Tactical', icon: '🛰️', description: 'High-contrast command', accent: '#f59e0b', bg: '#09090b' },
  { id: 'coral', label: 'Coral Reef', icon: '🪸', description: 'Warm scientific palette', accent: '#f97316', bg: '#1a0a00' },
  { id: 'arctic', label: 'Arctic Ice', icon: '❄️', description: 'Ice-blue high contrast', accent: '#7dd3fc', bg: '#0c1a2e' },
  { id: 'bioluminescence', label: 'Bioluminescence', icon: '✨', description: 'Deep ocean glow', accent: '#4ade80', bg: '#040c0a' },
]

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'oceaniq_theme_mode'

const ALL_THEMES: ThemeMode[] = ['dark', 'light', 'tactical', 'coral', 'arctic', 'bioluminescence']

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
      if (stored && ALL_THEMES.includes(stored)) return stored
    } catch {
      // Fallback if localStorage unavailable
    }
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore write failures
    }
  }, [theme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }

  const cycleTheme = () => {
    setThemeState((prev) => {
      const idx = ALL_THEMES.indexOf(prev)
      return ALL_THEMES[(idx + 1) % ALL_THEMES.length]
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
