import { Link } from 'react-router';
import { FaSpinner } from 'react-icons/fa';
import { formatSize } from '../components/DetailsPopup';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { usePremiumCheckout } from '../hooks/usePremiumCheckout';
import { formatPrice } from '../utils/razorpayCheckout';
import { SettingsSection, SettingsRow, Notice, primaryBtn, secondaryBtn } from './SettingsUI';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  paid: ['Paid', 'bg-success/10 text-success'],
  created: ['Not completed', 'bg-surface-muted text-text-muted'],
  failed: ['Failed', 'bg-danger/10 text-danger'],
  cancelled: ['Cancelled', 'bg-surface-muted text-text-muted'],
  refunded: ['Refunded', 'bg-surface-muted text-text-muted'],
};

function StatusPill({ status }) {
  const [label, cls] = STATUS_STYLES[status] || [status, 'bg-surface-muted text-text-muted'];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function SubscriptionSettings() {
  const { data, error, loading, reload } = usePaymentStatus();
  const { busy, message, start } = usePremiumCheckout(reload);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <FaSpinner className="animate-spin text-primary" size={24} />
      </div>
    );
  }
  if (error || !data) return <Notice kind="error">{error || 'Could not load your plan.'}</Notice>;

  const { plans, subscription, storage, payments, paymentsEnabled } = data;
  const premium = plans.premium;
  const isPremium = subscription.plan === 'premium';
  const canBuy = paymentsEnabled && premium.available;
  const percent = storage.max > 0 ? Math.min((storage.used / storage.max) * 100, 100) : 0;
  const overFree = !isPremium && storage.used > plans.free.storageBytes;

  return (
    <div className="flex flex-col gap-5">
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <SettingsSection title="Subscription" description="Your plan, validity and storage.">
        <SettingsRow label="Current plan">
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold">{isPremium ? premium.name : plans.free.name}</span>
            {isPremium && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Active
              </span>
            )}
          </span>
        </SettingsRow>

        {isPremium ? (
          <SettingsRow label="Valid until" hint="Premium does not renew automatically.">
            {formatDate(subscription.expiresAt)} · {subscription.daysLeft}{' '}
            {subscription.daysLeft === 1 ? 'day' : 'days'} left
          </SettingsRow>
        ) : (
          subscription.status === 'expired' && (
            <SettingsRow label="Last Premium ended">{formatDate(subscription.expiresAt)}</SettingsRow>
          )
        )}

        <div className="py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-text">
              <span className="text-lg font-semibold">{formatSize(storage.used)}</span>{' '}
              <span className="text-text-muted">of {formatSize(storage.max)} used</span>
            </p>
            <span className="text-sm font-semibold text-text-muted">{Math.round(percent)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div
              className={`h-full rounded-full ${percent >= 90 ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${storage.used > 0 ? Math.max(percent, 1) : 0}%` }}
            />
          </div>
          {overFree && (
            <p className="mt-2 text-[13px] font-medium text-danger">
              You are over the Free limit, so new uploads are paused. You can still download and
              delete files, or buy Premium to upload again.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 py-4">
          <button
            type="button"
            onClick={start}
            disabled={!canBuy || busy}
            className={`${primaryBtn} inline-flex items-center gap-2`}
          >
            {busy && <FaSpinner className="animate-spin" size={13} aria-hidden="true" />}
            {busy
              ? 'Processing…'
              : !canBuy
                ? 'Premium not available yet'
                : isPremium
                  ? `Extend by ${premium.durationDays} days · ${formatPrice(premium.pricePaise, premium.currency)}`
                  : `Upgrade · ${formatPrice(premium.pricePaise, premium.currency)} for ${premium.durationDays} days`}
          </button>
          <Link to="/pricing" className={secondaryBtn}>
            Compare plans
          </Link>
        </div>
      </SettingsSection>

      <SettingsSection title="Payment history" description="Your most recent payments.">
        {payments.length === 0 ? (
          <p className="py-6 text-sm text-text-muted">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">
                    {premium.name} · {p.durationDays} days
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {formatDate(p.paidAt || p.createdAt)}
                    {p.paymentId ? ` · ${p.paymentId}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-text">
                  {formatPrice(p.amount, p.currency)}
                </span>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  );
}

export default SubscriptionSettings;
