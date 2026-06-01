/** Shared with `login-rate-limit.ts` and client UI (e.g. login copy). Do not import Redis here. */
export const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MINUTES = LOGIN_RATE_LIMIT_WINDOW_SECONDS / 60;
