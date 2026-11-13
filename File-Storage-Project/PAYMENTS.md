# Razorpay payments (Test Mode)

One-time **Premium** purchase, valid for 30 days, no auto-renewal. Free stays at 1 GB.

## Server environment variables (Render → Environment)

| Variable | Required | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID` | yes | Test key id (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | yes | Never exposed to the browser |
| `RAZORPAY_WEBHOOK_SECRET` | for webhooks | The secret you type in the Razorpay dashboard when adding the webhook |
| `PREMIUM_PRICE_INR` | yes | Rupees, e.g. `99` or `149.50` (min ₹1). No default. |
| `PREMIUM_STORAGE_GB` | yes | Premium storage in GiB, must exceed Free. No default. |
| `PREMIUM_DURATION_DAYS` | no | Default `30` |
| `PREMIUM_PLAN_NAME` | no | Default `Premium` |
| `FREE_STORAGE_BYTES` | no | Default 1 GiB (only affects new accounts) |
| `SUBSCRIPTION_SWEEP_SECONDS` | no | Expiry sweep interval, default 300 |

Until `PREMIUM_PRICE_INR` and `PREMIUM_STORAGE_GB` are set, Premium shows "Not available yet" and the server refuses to create orders.

Run `npm run setup` once on the database (adds the `subscriptions`, `payments`, `webhookevents` collections and indexes).

## Webhook (Razorpay Dashboard → Test Mode → Settings → Webhooks)

- URL: `https://<your-render-service>.onrender.com/payments/webhook` (call Render directly, not the Vercel `/api` proxy)
- Secret: any strong string; put the same value in `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`

## Testing in Test Mode

1. Set the env vars above, redeploy the backend, then deploy the frontend (CSP already allows Razorpay).
2. Open **Plans & pricing** → **Upgrade**. Use Razorpay test payment details:
   - Card: `4111 1111 1111 1111`, any future expiry, any CVV, any name (OTP page: click Success)
   - UPI: `success@razorpay` (success) / `failure@razorpay` (failure)
3. Check: success message, plan shows Premium with an expiry date, sidebar storage jumps to the Premium size, a "Paid" row appears under Settings → Subscription.
4. Cancel: close the Checkout window → "Payment cancelled", history row "Cancelled".
5. Failure: use the failing UPI id or a failing test card → "Failed" row.
6. Duplicate: click Upgrade twice quickly, or resend a webhook from the dashboard → only one activation; the 30 days are added once.
7. Extend: buy again while Premium is active → expiry moves 30 days later.
8. Expiry: in MongoDB set the user's `subscriptions.expiresAt` to a past date; within 5 minutes (or on the next upload / page load) the plan returns to Free and the storage limit is restored. If used > Free limit, uploads are blocked; download and delete still work.
9. Refund: refund a test payment in the dashboard → `refund.processed` webhook revokes that payment's 30 days.
10. Security checks: a webhook without a valid `X-Razorpay-Signature` returns 400; a tampered `/payments/verify` call is rejected.

## Notes

- Amount, plan and storage are fixed on the server when the order is created.
- Activation is idempotent: the payment document flips to `paid` exactly once (atomic update inside a transaction); the checkout callback and the webhook can both arrive in any order.
- The storage limit used for uploads is read from MongoDB, not from the cached session; sessions are also updated in Redis after plan changes.
- Add future Premium-only features in `Server/config/plans.js` (`PLAN_FEATURES`) and guard routes with `requireFeature('<name>')`.
