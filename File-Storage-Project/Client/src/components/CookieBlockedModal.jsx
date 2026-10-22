import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCookieBite } from 'react-icons/fa';

const steps = [
  {
    browser: 'Chrome / Edge',
    text: 'Click the eye icon (or lock icon) in the address bar, then choose Third-party cookies and allow them for this site. Or open Settings, Privacy and security, Third-party cookies, and add this site to the allowed list.',
  },
  {
    browser: 'Brave',
    text: 'Click the lion icon in the address bar and turn Shields down for this site, or set Cookies to "Allow all cookies" for it.',
  },
  {
    browser: 'Firefox',
    text: 'Click the shield icon in the address bar and turn off Enhanced Tracking Protection for this site.',
  },
  {
    browser: 'Safari',
    text: 'Open Settings, Privacy, and turn off "Prevent cross-site tracking".',
  },
];

function CookieBlockedModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          <p className="text-sm text-text-muted mb-4">
            Your login worked, but your browser blocked the cookie that keeps
            you signed in. Allow third-party cookies for this site, then sign
            in again.
          </p>
        </div>

        <ul className="m-0 mb-5 p-0 list-none flex flex-col gap-2.5">
          {steps.map((s) => (
            <li
              key={s.browser}
              className="text-left text-[13px] text-text-muted leading-snug"
            >
              <span className="font-semibold text-text">{s.browser}: </span>
              {s.text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer hover:bg-primary-hover transition-colors"
        >
          I&apos;ve allowed cookies, sign in again
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default CookieBlockedModal;