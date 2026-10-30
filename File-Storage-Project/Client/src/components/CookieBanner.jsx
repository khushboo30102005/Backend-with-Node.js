import { FaCookieBite } from 'react-icons/fa';

// Inline notice shown above the auth form while cookies are blocked, so the
// user still sees why the form is disabled after closing the popup.
function CookieBanner({ checking, onHelp, onRecheck }) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-3 text-[13px] text-text"
    >
      <div className="flex items-start gap-2.5">
        <FaCookieBite size={16} className="mt-0.5 text-primary shrink-0" />
        <div>
          <p className="mb-1.5">
            Your browser is blocking cookies for this site, so you can&apos;t stay
            signed in.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onHelp}
              className="font-semibold text-primary hover:underline"
            >
              How to allow
            </button>
            <button
              type="button"
              onClick={onRecheck}
              disabled={checking}
              className="font-semibold text-primary hover:underline disabled:opacity-60"
            >
              {checking ? 'Checking...' : 'Check again'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
