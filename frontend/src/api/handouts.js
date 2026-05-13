import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 * @typedef {import('./types.js').AuditUpdateBody} AuditUpdateBody
 */

/**
 * Multipart upload (field name `file` matches FastAPI `File(...)`).
 * @param {File | Blob} file
 * @param {RequestContext & { accessToken: string, filename?: string }} ctx
 */
export function upload(file, ctx) {
  const formData = new FormData();
  const filename =
    ctx.filename ?? (file instanceof File ? file.name : "upload");
  formData.append("file", file, filename);
  return request("POST", paths.handouts.upload, {
    formData,
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {RequestContext & { accessToken: string }} ctx */
export function list(ctx) {
  return request("GET", paths.handouts.list, {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function getStatus(handoutId, ctx) {
  return request("GET", paths.handouts.status(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function getDetail(handoutId, ctx) {
  return request("GET", paths.handouts.detail(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {AuditUpdateBody} body @param {RequestContext & { accessToken: string }} ctx */
export function patchAudit(handoutId, body, ctx) {
  return request("PATCH", paths.handouts.audit(handoutId), {
    body,
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function approve(handoutId, ctx) {
  return request("POST", paths.handouts.approve(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function suggestTopics(handoutId, ctx) {
  return request("POST", paths.handouts.suggestTopics(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}
