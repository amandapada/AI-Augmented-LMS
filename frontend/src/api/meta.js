import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 */

/** @param {RequestContext} [ctx] */
export function health(ctx) {
  return request("GET", paths.health, { signal: ctx?.signal });
}
