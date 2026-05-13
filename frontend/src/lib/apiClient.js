import { getApiV1Base } from './apiBase'

export async function apiFetch(path, { method = 'GET', token, body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${getApiV1Base()}${path.startsWith('/') ? '' : '/'}${path}`
  const h = new Headers(headers)
  if (body !== undefined && !(body instanceof FormData) && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json')
  }
  if (token) {
    h.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(url, {
    method,
    headers: h,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

export function formatApiError(data, status, statusText) {
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
