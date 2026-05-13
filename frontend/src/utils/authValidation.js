/** Backend: RegisterRequest password Field(min_length=8, max_length=128) */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

/**
 * @returns {{ ok: true, email: string } | { ok: false, message: string }}
 */
export function validateEmail(email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return { ok: false, message: 'Email is required.' }
  if (!EMAIL_RE.test(normalized)) return { ok: false, message: 'Enter a valid email address.' }
  return { ok: true, email: normalized }
}

/**
 * @returns {{ ok: true, password: string } | { ok: false, message: string }}
 */
export function validateNewPassword(password) {
  const p = String(password ?? '')
  if (!p) return { ok: false, message: 'Password is required.' }
  if (p.length < PASSWORD_MIN)
    return { ok: false, message: `Password must be at least ${PASSWORD_MIN} characters.` }
  if (p.length > PASSWORD_MAX)
    return { ok: false, message: `Password must be at most ${PASSWORD_MAX} characters.` }
  return { ok: true, password: p }
}

/**
 * @param {string} role UI value: student | lecturer
 * @returns {'student' | 'lecturer'}
 */
export function toApiRole(role) {
  return role === 'lecturer' ? 'lecturer' : 'student'
}
