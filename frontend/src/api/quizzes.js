import { paths } from "./paths.js";
import { request } from "./http.js";

/**
 * @typedef {import('./types.js').RequestContext} RequestContext
 * @typedef {import('./types.js').QuizSubmissionBody} QuizSubmissionBody
 */

/** @param {number} handoutId @param {RequestContext & { accessToken: string }} ctx */
export function generate(handoutId, ctx) {
  return request("POST", paths.quizzes.generate(handoutId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} quizId @param {RequestContext & { accessToken: string }} ctx */
export function get(quizId, ctx) {
  return request("GET", paths.quizzes.get(quizId), {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {number} quizId @param {QuizSubmissionBody} body @param {RequestContext & { accessToken: string }} ctx */
export function submit(quizId, body, ctx) {
  return request("POST", paths.quizzes.submit(quizId), {
    body,
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}

/** @param {RequestContext & { accessToken: string }} ctx */
export function myAttempts(ctx) {
  return request("GET", paths.quizzes.myAttempts, {
    accessToken: ctx.accessToken,
    signal: ctx.signal,
  });
}
