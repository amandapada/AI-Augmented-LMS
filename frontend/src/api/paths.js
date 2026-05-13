import { API_V1_PREFIX } from "./config.js";

/** @param {string} sub path after /api/v1 (no leading slash required) */
export const v1 = (sub) => `${API_V1_PREFIX}/${sub.replace(/^\//, "")}`;

export const paths = {
  health: "/health",

  auth: {
    register: v1("auth/register"),
    login: v1("auth/login"),
    me: v1("auth/me"),
    forgotPassword: v1("auth/forgot-password"),
    resetPassword: v1("auth/reset-password"),
  },

  handouts: {
    upload: v1("handouts/upload"),
    list: v1("handouts"),
    status: (handoutId) => v1(`handouts/${handoutId}/status`),
    detail: (handoutId) => v1(`handouts/${handoutId}`),
    audit: (handoutId) => v1(`handouts/${handoutId}/audit`),
    approve: (handoutId) => v1(`handouts/${handoutId}/approve`),
    suggestTopics: (handoutId) => v1(`handouts/${handoutId}/suggest-topics`),
  },

  flashcards: {
    generate: (handoutId) => v1(`handouts/${handoutId}/generate-flashcards`),
    list: (handoutId) => v1(`handouts/${handoutId}/flashcards`),
    due: (handoutId) => v1(`handouts/${handoutId}/flashcards/due`),
    review: (flashcardId) => v1(`flashcards/${flashcardId}/review`),
  },

  quizzes: {
    generate: (handoutId) => v1(`handouts/${handoutId}/generate-quiz`),
    latestForHandout: (handoutId) => v1(`handouts/${handoutId}/quiz`),
    get: (quizId) => v1(`quizzes/${quizId}`),
    submit: (quizId) => v1(`quizzes/${quizId}/submit`),
    myAttempts: v1("quizzes/attempts/me"),
  },

  chat: {
    ask: (handoutId) => v1(`handouts/${handoutId}/chat`),
    history: (handoutId) => v1(`handouts/${handoutId}/chat/history`),
  },

  analytics: {
    overview: v1("analytics/overview"),
  },
};
