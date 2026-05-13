/**
 * HTTP client and typed API surface for the FastAPI backend.
 *
 * Usage:
 *   import { auth, handouts, ApiError } from './api';
 *   const data = await auth.login({ email, password });
 *   const mine = await handouts.list({ accessToken: data.token.access_token });
 *
 * Set `VITE_API_BASE_URL` in `.env` if the API is not on http://127.0.0.1:8000
 */

export { API_BASE_URL, API_V1_PREFIX } from "./config.js";
export { ApiError, request } from "./http.js";
export { paths } from "./paths.js";

export * as meta from "./meta.js";
export * as auth from "./auth.js";
export * as handouts from "./handouts.js";
export * as flashcards from "./flashcards.js";
export * as quizzes from "./quizzes.js";
export * as chat from "./chat.js";
export * as analytics from "./analytics.js";
