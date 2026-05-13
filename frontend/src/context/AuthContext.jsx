import { useEffect, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, AuthContext } from './authContext'
import { getApiV1Base } from '../lib/apiBase'

function formatApiError(data, status, statusText) {
  const apiMessage =
    data?.message && typeof data.message === 'string' ? data.message.trim() : ''
  if (apiMessage) return apiMessage
  if (status === 502 || status === 503) {
    return 'The API is not running or failed to start. From the repo root run npm run dev (starts API on port 8000), or start uvicorn separately. If the API terminal shows errors, copy .env.example to .env and set DATABASE_URL and other required values.'
  }
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    const parts = d.map((x) => {
      if (typeof x !== 'object' || x == null) return JSON.stringify(x)
      const loc = Array.isArray(x.loc) ? x.loc.join('.') : ''
      const msg = x.msg ? String(x.msg) : ''
      if (
        status === 422 &&
        /(^|\.)email$/.test(loc) &&
        /email address|email/i.test(msg)
      ) {
        return 'Enter a valid email address.'
      }
      return msg || JSON.stringify(x)
    })
    return [...new Set(parts)].filter(Boolean).join(' ') || statusText
  }
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

function displayNameFromEmail(email) {
  const nameFromEmail = String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
  return nameFromEmail.length > 0
    ? nameFromEmail.replace(/\b\w/g, (c) => c.toUpperCase())
    : 'User'
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    const parsed = raw ? safeParse(raw) : null
    if (!parsed || typeof parsed !== 'object')
      return { user: null, role: null, accessToken: null }
    return {
      user: parsed.user ?? null,
      role: parsed.role ?? null,
      accessToken: parsed.accessToken ?? null,
    }
  })

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  }, [auth])

  const value = useMemo(() => {
    return {
      user: auth.user,
      role: auth.role,
      accessToken: auth.accessToken,
      signIn: async ({ email, password }) => {
        let res
        try {
          res = await fetch(`${getApiV1Base()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: String(email || '').trim().toLowerCase(),
              password: String(password || ''),
            }),
          })
        } catch (e) {
          const name = e?.name
          const msg = e?.message || String(e)
          if (name === 'TypeError' || /failed to fetch/i.test(msg)) {
            throw new Error(
              'Could not reach the API. Start the backend (e.g. npm run dev from the repo root), or set VITE_API_URL if the API runs elsewhere.',
            )
          }
          throw e
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(formatApiError(data, res.status, res.statusText))

        const token = data?.token?.access_token
        if (!token) throw new Error('Login response missing access token.')

        const name =
          (data.full_name && String(data.full_name).trim()) || displayNameFromEmail(data.email)

        const next = {
          accessToken: token,
          user: {
            id: data.id,
            email: data.email,
            name,
          },
          role: data.role,
        }
        setAuth(next)
        return next
      },
      signOut: () => setAuth({ user: null, role: null, accessToken: null }),
      requestPasswordReset: async (email) => {
        const res = await fetch(`${getApiV1Base()}/auth/forgot-password`, {
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
        const res = await fetch(`${getApiV1Base()}/auth/reset-password`, {
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
  }, [auth.role, auth.user, auth.accessToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
