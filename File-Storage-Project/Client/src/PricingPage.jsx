import { Link } from 'react-router';
import { FaCheck, FaCrown, FaSpinner } from 'react-icons/fa';
import { formatSize } from './components/DetailsPopup';
import { Notice, primaryBtn, secondaryBtn } from './settings/SettingsUI';
import { usePaymentStatus } from './hooks/usePaymentStatus';
import { usePremiumCheckout } from './hooks/usePremiumCheckout';
import { formatPrice } from './utils/razorpayCheckout';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function Feature({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-text">
      <FaCheck size={12} className="mt-1 flex-shrink-0 text-success" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function PlanCard({ name, badge, price, priceNote, highlight, features, action, footnote }) {
  return (
    <section
      className={`relative flex flex-col rounded-2xl border bg-surface p-6 shadow-card ${
        highlight ? 'border-primary ring-1 ring-primary/40' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text">
          {highlight && <FaCrown size={15} className="text-primary" aria-hidden="true" />}
          {name}
        </h2>
        {badge && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-text">{price}</span>
        {priceNote && <span className="text-sm text-text-muted">{priceNote}</span>}
      </p>
      <ul className="mt-5 mb-6 flex flex-col gap-3">{features}</ul>
      <div className="mt-auto">
        {action}
        {footnote && <p className="mt-3 text-xs text-text-muted">{footnote}</p>}
      </div>
    </section>
  );
}

function PricingPage() {
  const { data, error, loading, reload } = usePaymentStatus();
  const { busy, message, start } = usePremiumCheckout(reload);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <FaSpinner className="animate-spin text-primary" size={26} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-7 pt-6">
        <Notice kind="error">{error || 'Could not load plans.'}</Notice>
      </div>
    );
  }

  const { plans, subscription, paymentsEnabled } = data;
  const premium = plans.premium;
  const isPremium = subscription.plan === 'premium';
  const canBuy = paymentsEnabled && premium.available;

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 sm:px-7 pt-4 pb-10 font-sans text-text">
      <header className="pb-5 text-center sm:text-left">
        <h1 className="text-[22px] font-bold tracking-tight">Plans &amp; pricing</h1>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Simple one-time payments. No subscription and no auto-renewal.
        </p>
      </header>

      {message && (
        <div className="mb-4">
          <Notice kind={message.kind}>{message.text}</Notice>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PlanCard
          name={plans.free.name}
          badge={!isPremium ? 'Current plan' : undefined}
          price={formatPrice(0)}
          priceNote="forever"
          features={
            <>
              <Feature>{formatSize(plans.free.storageBytes)} of storage</Feature>
              <Feature>Upload, share, download and delete your files</Feature>
            </>
          }
          action={
            <span className={`${secondaryBtn} block w-full cursor-default text-center opacity-60`}>
              {isPremium ? 'Included' : 'Your current plan'}
            </span>
          }
        />

        <PlanCard
          name={premium.name}
          highlight
          badge={isPremium ? 'Active' : undefined}
          price={canBuy ? formatPrice(premium.pricePaise, premium.currency) : 'Coming soon'}
          priceNote={canBuy ? `for ${premium.durationDays} days` : undefined}
          features={
            <>
              <Feature>
                {premium.storageBytes ? formatSize(premium.storageBytes) : 'More'} of storage
              </Feature>
              <Feature>Valid for {premium.durationDays} days from purchase</Feature>
              <Feature>One-time payment, never renews automatically</Feature>
              <Feature>Buy again any time to add {premium.durationDays} more days</Feature>
            </>
          }
          action={
            <>
              {isPremium && (
                <p className="mb-3 text-[13px] text-text-muted">
                  Active until <strong className="text-text">{formatDate(subscription.expiresAt)}</strong>{' '}
                  · {subscription.daysLeft} {subscription.daysLeft === 1 ? 'day' : 'days'} left
                </p>
              )}
              <button
                type="button"
                onClick={start}
                disabled={!canBuy || busy}
                className={`${primaryBtn} w-full inline-flex items-center justify-center gap-2`}
              >
                {busy && <FaSpinner className="animate-spin" size={13} aria-hidden="true" />}
                {busy
                  ? 'Processing…'
                  : !canBuy
                    ? 'Not available yet'
                    : isPremium
                      ? `Extend by ${premium.durationDays} days`
                      : `Upgrade to ${premium.name}`}
              </button>
            </>
          }
          footnote="Secure payment by Razorpay. We never see or store your card details."
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface px-5 py-4 text-[13px] text-text-muted">
        <p className="font-semibold text-text">When Premium ends</p>
        <p className="mt-1">
          You go back to Free automatically. All your files are kept, and you can still download
          and delete them. If you are using more than the Free limit, new uploads are paused until
          you free up space or buy Premium again.
        </p>
        <p className="mt-2">
          <Link to="/settings/subscription" className="font-semibold text-primary hover:underline">
            Manage subscription and payment history
          </Link>
        </p>
      </div>
    </div>
  );
}

export default PricingPage;
