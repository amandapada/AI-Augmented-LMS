import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  forgotPassword as apiForgotPassword,
  login as apiLogin,
  registerAccount as apiRegisterAccount,
  resetPassword as apiResetPassword,
} from '../api/auth.js'
import { ApiError, request } from '../api/http.js'
import { paths } from '../api/paths.js'
import { AUTH_STORAGE_KEY, AuthContext } from './authContext'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function deriveDisplayName(email) {
  const local = String(email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
  if (!local) return 'User'
  return local.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** @param {Record<string, unknown>} raw User fields from login/register payload (no token). */
function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null
  const email = String(raw.email ?? '')
  const full_name = raw.full_name != null ? String(raw.full_name) : null
  const name =
    (full_name && full_name.trim()) || deriveDisplayName(email)
  return {
    id: raw.id,
    email,
    role: raw.role,
    full_name: full_name?.trim() || null,
    created_at: raw.created_at,
    name,
  }
}

/** @param {Record<string, unknown>} payload API _AuthPayload shape */
function sessionFromAuthPayload(payload) {
  if (!payload || typeof payload !== 'object' || !('token' in payload)) {
    return { user: null, accessToken: null }
  }
  const tokenObj = payload.token
  const accessToken =
    tokenObj && typeof tokenObj === 'object' && 'access_token' in tokenObj
      ? String(tokenObj.access_token)
      : null
  const { token: _t, ...rest } = payload
  const user = normalizeUser(rest)
  return { user, accessToken }
}

function readStoredSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  const parsed = raw ? safeParse(raw) : null
  if (!parsed || typeof parsed !== 'object') return { user: null, accessToken: null }
  if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
    return { user: null, accessToken: null }
  }
  return {
    user: normalizeUser(parsed.user),
    accessToken: parsed.accessToken,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredSession().user)
  const [accessToken, setAccessToken] = useState(() => readStoredSession().accessToken)

  useEffect(() => {
    if (user && accessToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken }))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [user, accessToken])

  const clearSession = useCallback(() => {
    setUser(null)
    setAccessToken(null)
  }, [])

  useEffect(() => {
    if (!accessToken) return

    let cancelled = false
    ;(async () => {
      try {
        const me = await request('GET', paths.auth.me, { accessToken })
        if (!cancelled) setUser(normalizeUser(me))
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          clearSession()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [accessToken, clearSession])

  const signIn = useCallback(async ({ email, password }) => {
    const payload = await apiLogin(
      { email: String(email).trim().toLowerCase(), password },
      undefined,
    )
    const session = sessionFromAuthPayload(payload)
    setUser(session.user)
    setAccessToken(session.accessToken)
    return session.user
  }, [])

  const signUp = useCallback(async (body) => {
    const payload = await apiRegisterAccount(body, undefined)
    const session = sessionFromAuthPayload(payload)
    setUser(session.user)
    setAccessToken(session.accessToken)
    return session.user
  }, [])

  const signOut = useCallback(() => {
    clearSession()
  }, [clearSession])

  const requestPasswordReset = useCallback(async (email) => {
    return apiForgotPassword(
      { email: String(email).trim().toLowerCase() },
      undefined,
    )
  }, [])

  const resetPasswordWithToken = useCallback(async (token, password) => {
    return apiResetPassword({ token, password }, undefined)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      accessToken,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      resetPasswordWithToken,
    }),
    [
      user,
      accessToken,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      resetPasswordWithToken,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
