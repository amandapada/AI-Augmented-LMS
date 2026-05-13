import { API_BASE_URL } from "./config.js";

/**
 * Structured error from AppError handler or generic HTTP failure.
 */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {unknown} body Parsed JSON or raw text hint
   */
  constructor(status, body) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String(body.message)
        : `Request failed (${status})`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  get code() {
    return typeof this.body === "object" && this.body !== null && "code" in this.body
      ? this.body.code
      : undefined;
  }

  get details() {
    return typeof this.body === "object" && this.body !== null && "details" in this.body
      ? this.body.details
      : undefined;
  }
}

/**
 * @typedef {Object} RequestContext
 * @property {string} [accessToken] Bearer JWT for protected routes
 * @property {AbortSignal} [signal]
 */

/**
 * @param {string} method
 * @param {string} path Absolute path on the API host (e.g. `/api/v1/auth/me`)
 * @param {RequestContext & {
 *   query?: Record<string, string | number | boolean | undefined | null>,
 *   body?: unknown,
 *   formData?: FormData,
 *   headers?: Record<string, string>,
 * }} [options]
 * @returns {Promise<unknown>}
 */
export async function request(method, path, options = {}) {
  if (typeof method !== "string" || !method.trim()) {
    throw new TypeError(`request(): invalid HTTP method (${String(method)})`);
  }

  const { accessToken, signal, query, body, formData, headers: extraHeaders } = options;

  const url = new URL(path, API_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  /** @type {HeadersInit} */
  const headers = { ...extraHeaders };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  /** @type {RequestInit} */
  const init = { method: method.toUpperCase(), headers, signal };

  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);

  const text = await res.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, parsed);
  }

  return parsed;
}
