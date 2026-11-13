// Single source of truth for plans. Everything is configurable from the
// environment, and nothing here invents a price or a Premium size: until
// PREMIUM_PRICE_INR and PREMIUM_STORAGE_GB are set, Premium is "unavailable"
// and the server refuses to create payment orders.
//
//   FREE_STORAGE_BYTES     optional  default 1 GiB (the existing Free limit)
//   PREMIUM_PRICE_INR      required  price in rupees, e.g. 99 or 149.50
//   PREMIUM_STORAGE_GB     required  Premium storage in GiB, e.g. 10
//   PREMIUM_DURATION_DAYS  optional  default 30 (one-time purchase, no auto-renew)
//   PREMIUM_PLAN_NAME      optional  default "Premium"

export const GIB = 1024 ** 3;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const CURRENCY = 'INR';

const positive = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function getFreeStorageBytes() {
  const n = positive(process.env.FREE_STORAGE_BYTES);
  return n ? Math.floor(n) : 1 * GIB;
}

// Evaluated on every call (not at import) so config changes and tests apply.
export function getPremiumPlan() {
  const price = positive(process.env.PREMIUM_PRICE_INR);
  const gb = positive(process.env.PREMIUM_STORAGE_GB);
  const days = positive(process.env.PREMIUM_DURATION_DAYS);
  const free = getFreeStorageBytes();

  const pricePaise = price ? Math.round(price * 100) : null; // Razorpay amounts are in paise
  const storageBytes = gb ? Math.round(gb * GIB) : null;
  const durationDays = days ? Math.floor(days) : 30;

  let reason = null;
  if (!pricePaise || pricePaise < 100) reason = 'PREMIUM_PRICE_INR is not set (minimum ₹1).';
  else if (!storageBytes) reason = 'PREMIUM_STORAGE_GB is not set.';
  else if (storageBytes <= free) reason = 'PREMIUM_STORAGE_GB must be larger than the Free limit.';
  else if (durationDays < 1) reason = 'PREMIUM_DURATION_DAYS is invalid.';

  return {
    id: 'premium',
    name: process.env.PREMIUM_PLAN_NAME?.trim() || 'Premium',
    available: !reason,
    unavailableReason: reason,
    currency: CURRENCY,
    pricePaise,
    storageBytes,
    durationDays,
  };
}

export function getFreePlan() {
  return {
    id: 'free',
    name: 'Free',
    available: true,
    currency: CURRENCY,
    pricePaise: 0,
    storageBytes: getFreeStorageBytes(),
  };
}

// Feature flags per plan. Premium is storage-only for now; to gate a future
// feature, add its key to PLAN_FEATURES.premium and protect the route with
// requireFeature('<key>') from middlewares/planMiddleware.js.
export const PLAN_FEATURES = {
  free: [],
  premium: [],
};

export const planHasFeature = (plan, feature) =>
  Boolean(PLAN_FEATURES[plan]?.includes(feature));
