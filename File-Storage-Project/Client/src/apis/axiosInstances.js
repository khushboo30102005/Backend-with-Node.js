import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
});

// If the API proxy is misconfigured, Vercel answers with the app's index.html
// (HTTP 200) instead of JSON. Fail loudly instead of crashing on undefined data.
const rejectHtmlResponses = (response) => {
  const type = response.headers?.['content-type'] || '';
  if (type.includes('text/html') && response.config?.responseType !== 'text') {
    const err = new Error('API returned a web page instead of JSON');
    err.response = { ...response, status: 502 };
    return Promise.reject(err);
  }
  return response;
};
axiosWithCreds.interceptors.response.use(rejectHtmlResponses);
axiosWithoutCreds.interceptors.response.use(rejectHtmlResponses);

// ---------------------------------------------------------------------------
// CSRF protection. The server requires an X-CSRF-Token header on every
// state-changing cookie-authenticated request. The token is fetched once,
// kept only in memory (never in localStorage) and bound to the current
// session, so it is dropped whenever the session changes (login / logout) and
// refreshed automatically if the server ever rejects it.
// ---------------------------------------------------------------------------
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const CSRF_ERROR_CODES = new Set(['CSRF_TOKEN_MISSING', 'CSRF_TOKEN_INVALID']);
const SESSION_CHANGING_PATHS = [
  '/auth/google',
  '/auth/verify-login-otp',
  '/user/logout',
  '/user/logout-all',
];

let csrfToken = null;
let csrfRequest = null;

export const clearCsrfToken = () => {
  csrfToken = null;
};

const fetchCsrfToken = () => {
  if (!csrfRequest) {
    csrfRequest = axiosWithCreds
      .get('/auth/csrf-token')
      .then(({ data }) => {
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
};

const pathOf = (config) => (config.url || '').split('?')[0];

axiosWithCreds.interceptors.request.use(async (config) => {
  if (!UNSAFE_METHODS.has((config.method || 'get').toLowerCase())) return config;
  const token = csrfToken || (await fetchCsrfToken());
  config.headers.set('X-CSRF-Token', token);
  return config;
});

axiosWithCreds.interceptors.response.use(
  (response) => {
    if (SESSION_CHANGING_PATHS.includes(pathOf(response.config))) clearCsrfToken();
    return response;
  },
  async (error) => {
    const { config, response } = error;
    if (
      config &&
      !config._csrfRetried &&
      response?.status === 403 &&
      CSRF_ERROR_CODES.has(response.data?.code)
    ) {
      // The session changed since the token was issued (e.g. signed in in
      // another tab). Get a fresh token and try exactly once more.
      clearCsrfToken();
      config._csrfRetried = true;
      await fetchCsrfToken();
      return axiosWithCreds(config);
    }
    return Promise.reject(error);
  },
);
