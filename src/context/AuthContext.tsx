/**
 * AuthContext.tsx — User Authentication & Profile Context
 * OceanIQ — Indian Ocean 3D Intelligence Platform | INCOIS / MoES
 *
 * Stores user login info (Name, Email, Designation) in localStorage.
 * Provides a simple session-based auth guard for the platform.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

export type UserDesignation =
  | 'Research Scientist'
  | 'Ocean Data Analyst'
  | 'Disaster Management Officer'
  | 'Maritime Safety Officer'
  | 'Environmental Consultant'
  | 'Coastal Engineer'
  | 'Student / Researcher'
  | 'Policy Advisor'
  | 'Fisheries Officer'
  | 'Other'

export interface UserProfile {
  name: string
  email: string
  designation: UserDesignation | string
  loginTime: string
}

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  login: (profile: UserProfile) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_STORAGE_KEY = 'oceaniq_user_profile'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile
        if (parsed.name && parsed.email && parsed.designation) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return null
  })

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [user])

  const login = (profile: UserProfile) => {
    setUser(profile)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
