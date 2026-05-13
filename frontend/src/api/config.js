/**
 * Backend origin (no trailing slash). Override in Vite with VITE_API_BASE_URL.
 * @see https://vite.dev/guide/env-and-mode
 */
/** Prefer VITE_API_BASE_URL; VITE_API_URL is accepted for legacy parity with older pages. */
const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export const API_BASE_URL = String(rawBase).replace(/\/$/, "");

/** FastAPI version prefix — matches app.core.config.Settings.API_V1_PREFIX */
export const API_V1_PREFIX = "/api/v1";
