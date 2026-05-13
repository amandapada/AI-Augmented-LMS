/**
 * API base for `/api/v1` requests.
 *
 * - When `VITE_API_URL` is set: call that host (must match backend CORS in dev).
 * - When unset: use same-origin `/api/v1` so Vite's dev/preview proxy can forward
 *   to the FastAPI server (avoids cross-origin "Failed to fetch" during local dev).
 */
export function getApiV1Base() {
  const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  if (raw != null && String(raw).trim() !== '') {
    const trimmed = String(raw).replace(/\/$/, '')
    if (trimmed.endsWith('/api/v1')) return trimmed
    return `${trimmed}/api/v1`
  }
  return '/api/v1'
}
