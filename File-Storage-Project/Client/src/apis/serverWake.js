import axios from 'axios';

// ---------------------------------------------------------------------------
// Cold-start handling. The API runs on Render's free tier, which puts the
// server to sleep after ~15 idle minutes. While it starts up again (30-60s),
// Render's edge answers with a plain-text/HTML 429 or 502-504 instead of
// passing requests to Express. Those requests never reached our app, so it is
// safe to wait for the server and send them again.
//
// One shared "waker" probes the server with backoff while every failed request
// waits on it, so a page that fires five requests at once doesn't send five
// times as many wake-up attempts (Render rate-limits those too).
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Waits between probes: ~90s in total, longer than a typical cold start.
const PROBE_DELAYS_MS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000, 15000];
// A request that fails again right after a successful probe is retried at
// most this many times before the error goes back to the caller.
const MAX_RETRIES_PER_REQUEST = 2;

const PLATFORM_STATUSES = new Set([429, 502, 503, 504]);
const SAFE_METHODS = new Set(['get', 'head', 'options']);

// ---- tiny store for the "waking up" banner --------------------------------
let waking = false;
const listeners = new Set();

export const isServerWaking = () => waking;
export const subscribeServerWaking = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const setWaking = (value) => {
  if (waking === value) return;
  waking = value;
  listeners.forEach((listener) => listener());
};

// ---- detection -------------------------------------------------------------
const isJsonResponse = (response) =>
  (response?.headers?.['content-type'] || '').includes('application/json');

// True when the error came from the hosting platform rather than our server.
// Our own Express errors (including the API rate limiter's 429) are always
// JSON, so they are left alone.
export const isColdStartError = (error) => {
  const { config, response } = error || {};
  if (!config || axios.isCancel(error) || error.code === 'ERR_CANCELED') return false;
  if (error.code === 'ERR_HTML_RESPONSE') return false; // proxy misconfig, not sleep

  const method = (config.method || 'get').toLowerCase();

  // No response at all (connection dropped/refused): only retry requests that
  // are safe to repeat, since a POST may have reached the server.
  if (!response) return SAFE_METHODS.has(method) && error.code !== 'ECONNABORTED';

  if (!PLATFORM_STATUSES.has(response.status) || isJsonResponse(response)) return false;

  // 429/503 from the edge means the request was never forwarded, so any
  // method is safe to resend. 502/504 may mean it reached the server and
  // timed out, so only repeat safe methods.
  return response.status === 429 || response.status === 503 || SAFE_METHODS.has(method);
};

// ---- waker -----------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The probe goes through the same route as normal API calls (the /api
// rewrite in production, CORS with credentials in development). The cookie
// probe is cheap, touches no database and sits outside the API rate limiter.
const probeServer = async () => {
  try {
    const res = await axios.get('/auth/cookie-test', {
      baseURL: BASE_URL,
      withCredentials: true,
      timeout: 20000,
      validateStatus: () => true,
    });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
};

let wakePromise = null;

// Resolves true once the server answers, false if it never woke up.
const waitForServer = () => {
  if (!wakePromise) {
    setWaking(true);
    wakePromise = (async () => {
      for (const delay of PROBE_DELAYS_MS) {
        await sleep(delay);
        if (await probeServer()) return true;
      }
      return false;
    })().finally(() => {
      wakePromise = null;
      setWaking(false);
    });
  }
  return wakePromise;
};

// Response-error interceptor: wait for the server, then resend the request.
export const installColdStartRetry = (instance) => {
  instance.interceptors.response.use(undefined, async (error) => {
    const { config } = error || {};
    if (!isColdStartError(error)) return Promise.reject(error);

    config._coldStartRetries = (config._coldStartRetries || 0) + 1;
    if (config._coldStartRetries > MAX_RETRIES_PER_REQUEST) return Promise.reject(error);

    const awake = await waitForServer();
    if (!awake || config.signal?.aborted) return Promise.reject(error);
    return instance(config);
  });
};
