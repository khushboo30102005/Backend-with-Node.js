import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCookieBite } from 'react-icons/fa';

const steps = [
  {
    id: 'chrome',
    browser: 'Chrome / Edge',
    text: 'Click the eye icon (or lock icon) in the address bar, then choose Third-party cookies and allow them for this site. Or open Settings, Privacy and security, Third-party cookies, and add this site to the allowed list.',
  },
  {
    id: 'brave',
    browser: 'Brave',
    text: 'Click the lion icon in the address bar and turn Shields down for this site, or set Cookies to "Allow all cookies" for it.',
  },
  {
    id: 'firefox',
    browser: 'Firefox',
    text: 'Click the shield icon in the address bar and turn off Enhanced Tracking Protection for this site.',
  },
  {
    id: 'safari',
    browser: 'Safari',
    text: 'Open Settings, Privacy, and turn off "Prevent cross-site tracking".',
  },
];

function detectBrowser() {
  const ua = navigator.userAgent;
  if (navigator.brave) return 'brave';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Edg\//.test(ua) || /Chrome\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua)) return 'safari';
  return null;
}

// variant 'precheck': shown before login/register when the browser blocks cookies.
// variant 'postlogin': shown when login succeeded but the session cookie was dropped.
function CookieBlockedModal({
  onClose,
  onRecheck,
  checking = false,
  variant = 'precheck',
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const detected = detectBrowser();
  const mine = steps.find((s) => s.id === detected);
  const others = steps.filter((s) => s.id !== detected);

  const message =
    variant === 'postlogin'
      ? 'Your login worked, but your browser blocked the cookie that keeps you signed in. Allow cookies for this site, then sign in again.'
      : 'Your browser is blocking the cookie that keeps you signed in. Allow cookies for this site and you can continue. Browsers do not let websites switch this on themselves, so it takes one quick change on your side.';

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-[2px] flex justify-center items-center z-[999]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-blocked-title"
        className="bg-surface p-6 w-[90%] max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <FaCookieBite size={34} className="text-primary mb-3" />
          <h2
            id="cookie-blocked-title"
            className="text-lg font-bold text-text mb-1"
          >
            Please allow cookies to sign in
          </h2>
          <p className="text-sm text-text-muted mb-4">{message}</p>
        </div>

        <ul className="m-0 mb-4 p-0 list-none flex flex-col gap-2.5">
          {mine && (
            <li className="text-left text-[13px] text-text-muted leading-snug rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
              <span className="font-semibold text-text">
                {mine.browser} (your browser):{' '}
              </span>
              {mine.text}
            </li>
          )}
        </ul>

        <details className="mb-5" open={!mine}>
          <summary className="cursor-pointer text-[13px] font-semibold text-primary">
            {mine ? 'Using a different browser?' : 'Steps for your browser'}
          </summary>
          <ul className="m-0 mt-2.5 p-0 list-none flex flex-col gap-2.5">
            {(mine ? others : steps).map((s) => (
              <li
                key={s.id}
                className="text-left text-[13px] text-text-muted leading-snug"
              >
                <span className="font-semibold text-text">{s.browser}: </span>
                {s.text}
              </li>
            ))}
          </ul>
        </details>

        <button
          type="button"
          onClick={onRecheck || onClose}
          disabled={checking}
          className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {checking
            ? 'Checking...'
            : variant === 'postlogin'
              ? "I've allowed cookies, sign in again"
              : "I've allowed cookies, check again"}
        </button>
        {onRecheck && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-text-muted cursor-pointer hover:text-text transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default CookieBlockedModal;
