import { useEffect, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, AuthContext } from './authContext'

function apiBase() {
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
}

function formatApiError(data, status, statusText) {
  if (data?.message && typeof data.message === 'string') return data.message
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d))
    return d
      .map((x) => (typeof x === 'object' && x?.msg ? x.msg : JSON.stringify(x)))
      .join(' ')
  if (d != null) return String(d)
  return data?.message || statusText || `Request failed (${status})`
}

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const parsed = raw ? safeParse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { user: null, role: null }
    return {
      user: parsed.user ?? null,
      role: parsed.role ?? null,
    }
  })

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  }, [auth])

  const value = useMemo(() => {
    return {
      user: auth.user,
      role: auth.role,
      signIn: async ({ email, role }) => {
        // Placeholder for real auth integration.
        // Keep it async so swapping in a real API stays drop-in.
        await new Promise((r) => setTimeout(r, 500))
        const nameFromEmail = String(email || '')
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .trim()
        const displayName =
          nameFromEmail.length > 0
            ? nameFromEmail.replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Student'

        setAuth({
          user: { email, name: displayName },
          role,
        })
      },
      signOut: () => setAuth({ user: null, role: null }),
      requestPasswordReset: async (email) => {
        const res = await fetch(`${apiBase()}/api/v1/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: String(email || '').trim().toLowerCase() }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok)
          throw new Error(formatApiError(data, res.status, res.statusText))
        return data
      },
      resetPasswordWithToken: async (token, password) => {
        const res = await fetch(`${apiBase()}/api/v1/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok)
          throw new Error(formatApiError(data, res.status, res.statusText))
        return data
      },
    }
  }, [auth.role, auth.user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

