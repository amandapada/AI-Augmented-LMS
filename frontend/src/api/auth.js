import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RegisterBody} RegisterBody
 * @typedef {import('./types.js').LoginBody} LoginBody
 * @typedef {import('./types.js').AuthPayload} AuthPayload
 * @typedef {import('./types.js').UserPublic} UserPublic
 * @typedef {import('./types.js').RequestContext} RequestContext
 */

/**
 * POST /api/v1/auth/register (never use as a browser navigation URL — that issues GET).
 * @param {RegisterBody} body
 * @param {RequestContext} [ctx]
 */
export function registerAccount(body, ctx) {
  return request("POST", paths.auth.register, { body, signal: ctx?.signal });
}

/** @param {LoginBody} body @param {RequestContext} [ctx] */
export function login(body, ctx) {
  return request("POST", paths.auth.login, { body, signal: ctx?.signal });
}

/** @param {RequestContext & { accessToken: string }} ctx */
export function me(ctx) {
  return request("GET", paths.auth.me, {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {{ email: string }} body @param {RequestContext} [ctx] */
export function forgotPassword(body, ctx) {
  return request("POST", paths.auth.forgotPassword, { body, signal: ctx?.signal });
}

/** @param {{ token: string; password: string }} body @param {RequestContext} [ctx] */
export function resetPassword(body, ctx) {
  return request("POST", paths.auth.resetPassword, { body, signal: ctx?.signal });
}
