import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 */

/** @type {{ token: string, force: boolean, promise: Promise<unknown> } | null} */
let _overviewInFlight = null;

/**
 * @param {RequestContext & { accessToken: string, forceRefresh?: boolean }} ctx
 */
export function overview(ctx) {
  const force = Boolean(ctx.forceRefresh);

  // Dedupe identical in-flight requests (helps avoid double-fetch in React StrictMode dev).
  if (
    !force &&
    _overviewInFlight &&
    _overviewInFlight.token === ctx.accessToken &&
    _overviewInFlight.force === false
  ) {
    return _overviewInFlight.promise;
  }

  const promise = request("GET", paths.analytics.overview, {
    accessToken: ctx.accessToken,
    // Intentionally do not pass ctx.signal here: aborting during StrictMode remount
    // shows "canceled" and triggers an extra retry. Callers can ignore results instead.
    query: force ? { force_refresh: true } : undefined,
  }).finally(() => {
    if (_overviewInFlight && _overviewInFlight.promise === promise) {
      _overviewInFlight = null;
    }
  });

  if (!force) {
    _overviewInFlight = { token: ctx.accessToken, force: false, promise };
  }

  return promise;
}
