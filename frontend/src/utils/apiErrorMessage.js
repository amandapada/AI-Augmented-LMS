import { ApiError } from '../api/http.js'

/**
 * Human-readable message from fetch errors, ApiError, or unknown.
 * @param {unknown} err
 */
export function getApiErrorMessage(err) {
  if (err instanceof ApiError) {
    const body = err.body
    if (typeof body === 'object' && body !== null && typeof body.message === 'string') {
      return body.message
    }
    const detail = typeof body === 'object' && body !== null ? body.detail : undefined
    if (Array.isArray(detail)) {
      return detail
        .map((x) => (typeof x === 'object' && x != null && 'msg' in x ? String(x.msg) : JSON.stringify(x)))
        .join(' ')
    }
    if (typeof detail === 'string') return detail
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
