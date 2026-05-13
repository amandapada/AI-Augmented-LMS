import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 * @typedef {import('./types.js').FlashcardReviewBody} FlashcardReviewBody
 */

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function generate(handoutId, ctx) {
  return request("POST", paths.flashcards.generate(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function list(handoutId, ctx) {
  return request("GET", paths.flashcards.list(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function listDue(handoutId, ctx) {
  return request("GET", paths.flashcards.due(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} flashcardId @param {FlashcardReviewBody} body @param {RequestContext & { accessToken: string }} ctx */
export function submitReview(flashcardId, body, ctx) {
  return request("POST", paths.flashcards.review(flashcardId), {
    body,
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}
