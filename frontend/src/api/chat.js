import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 * @typedef {import('./types.js').ChatAskBody} ChatAskBody
 */

/** @param {number} handoutId @param {ChatAskBody} body @param {RequestContext & { accessToken: string }} ctx */
export function ask(handoutId, body, ctx) {
  return request("POST", paths.chat.ask(handoutId), {
    body,
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function history(handoutId, ctx) {
  return request("GET", paths.chat.history(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}
