/**
 * Shared JSDoc types aligned with FastAPI / Pydantic schemas (app/schemas/*).
 * In JSX, use a JSDoc @type tag importing from this file for IDE hints.
 */

/**
 * @typedef {Object} RequestContext
 * @property {string} [accessToken] Bearer JWT
 * @property {AbortSignal} [signal]
 */

/** @typedef {'student' | 'lecturer' | 'admin'} UserRole */

/**
 * @typedef {Object} RegisterBody
 * @property {string} email
 * @property {string} password
 * @property {string} [full_name]
 * @property {UserRole} [role]
 */

/**
 * @typedef {Object} LoginBody
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} TokenResponse
 * @property {string} access_token
 * @property {string} [token_type]
 * @property {number} [expires_in_minutes]
 */

/**
 * @typedef {Object} UserPublic
 * @property {number} id
 * @property {string} email
 * @property {UserRole} role
 * @property {string | null} [full_name]
 * @property {string} created_at ISO datetime
 */

/**
 * @typedef {Object} AuthPayload
 * @property {TokenResponse} token
 * @property {number} id
 * @property {string} email
 * @property {UserRole} role
 * @property {string | null} [full_name]
 * @property {string} created_at
 */

/**
 * @typedef {Object} AuditUpdateBody
 * @property {string} [extracted_text]
 * @property {string[]} [topics]
 */

/**
 * @typedef {'hard' | 'good' | 'easy'} ReviewDifficulty
 */

/**
 * @typedef {Object} FlashcardReviewBody
 * @property {ReviewDifficulty} difficulty
 */

/**
 * @typedef {Object} QuizSubmissionBody
 * @property {string[]} [mcq_answers] Letters in question order, e.g. ['A','B']
 * @property {string[]} [short_answers]
 */

/**
 * @typedef {Object} ChatAskBody
 * @property {string} question
 */

export {};
