import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 */

/**
 * @param {RequestContext & { accessToken: string, forceRefresh?: boolean }} ctx
 */
export function overview(ctx) {
  return request("GET", paths.analytics.overview, {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
    query: ctx.forceRefresh ? { force_refresh: true } : undefined,
  });
}
