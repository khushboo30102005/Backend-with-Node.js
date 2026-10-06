import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { setPassword } from '../apis/userApi';
import { sendOtp, verifyOtp, setPasswordWithOtp } from '../apis/authApi';

const MIN_LENGTH = 4;
const MAX_LENGTH = 72;

const inputClass =
  'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface text-text transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12';

const smallBtn =
  'absolute top-1/2 right-1.5 -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold leading-none rounded-md bg-primary text-white cursor-pointer transition-colors duration-150 hover:bg-primary-hover disabled:opacity-55 disabled:cursor-not-allowed';

function PasswordInput({ value, onChange, placeholder, inputRef }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        className={`${inputClass} pr-11`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
      >
        {visible ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
      </button>
    </div>
  );
}

// `email` present  => signed-out flow (login page): ownership of the email is
//                     proven with an OTP (Send code -> Verify).
// `email` absent   => signed-in flow (profile menu): the session proves identity.
function SetPasswordModal({ email, onClose, onSuccess }) {
  const needsOtp = Boolean(email);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!needsOtp) inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendCode() {
    setError('');
    setSendingOtp(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      setOtp('');
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (!/^\d{4}$/.test(otp)) {
      setError('Enter the 4-digit code sent to your email.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await verifyOtp(email, otp);
      setOtpVerified(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setVerifying(false);
    }
  }

  function validate() {
    if (needsOtp && !otpVerified)
      return 'Please verify the code sent to your email first.';
    if (!newPassword) return 'Please enter a new password.';
    if (newPassword.length < MIN_LENGTH)
      return `Password must be at least ${MIN_LENGTH} characters long.`;
    if (newPassword.length > MAX_LENGTH)
      return `Password cannot exceed ${MAX_LENGTH} characters.`;
    if (!confirmPassword) return 'Please confirm your password.';
    if (newPassword !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (needsOtp) {
        await setPasswordWithOtp({ email, otp, newPassword, confirmPassword });
        setDone(true);
        onSuccess?.(newPassword);
      } else {
        await setPassword(newPassword, confirmPassword);
        setDone(true);
        onSuccess?.();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not set password.');
      if (!needsOtp && err.response?.status === 409) onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-[2px] flex justify-center items-center z-[999]"
      onClick={onClose}
    >
      <div
        className="bg-surface p-6 w-[90%] max-w-[400px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="flex flex-col items-center text-center py-2">
            <FaCheckCircle size={34} className="text-success mb-3" />
            <h2 className="text-lg font-bold text-text mb-1">Password set</h2>
            <p className="text-sm text-text-muted mb-5">
              {needsOtp
                ? 'You can now log in with your email and password.'
                : 'You can now sign in with Google or with your email and password.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="mt-0 mb-1 text-lg font-bold text-text">
              Set a password
            </h2>
            <p className="text-sm text-text-muted mb-4">
              {needsOtp
                ? 'This account was created with Google. Verify your email, then choose a password to also log in with it.'
                : 'Your account was created with Google. Add a password to also sign in with your email.'}
            </p>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              {needsOtp && (
                <>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      aria-label="Email"
                      className={`${inputClass} pr-[96px] opacity-70`}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingOtp || countdown > 0 || otpVerified}
                      className={smallBtn}
                    >
                      {otpVerified
                        ? 'Verified'
                        : sendingOtp
                          ? 'Sending...'
                          : countdown > 0
                            ? `${countdown}s`
                            : otpSent
                              ? 'Resend'
                              : 'Send code'}
                    </button>
                  </div>

                  {otpSent && (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        disabled={otpVerified}
                        className={`${inputClass} pr-[96px] disabled:opacity-60`}
                        placeholder="4-digit code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ''))
                        }
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifying || otpVerified || otp.length !== 4}
                        className={smallBtn}
                      >
                        {verifying
                          ? 'Verifying...'
                          : otpVerified
                            ? 'Verified'
                            : 'Verify'}
                      </button>
                    </div>
                  )}

                  {otpSent && !otpVerified && (
                    <p className="text-xs text-text-muted -mt-1">
                      We sent a code to {email}.
                    </p>
                  )}
                </>
              )}

              <PasswordInput
                inputRef={inputRef}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordInput
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {error && (
                <p className="text-danger text-[13px] -mt-1">{error}</p>
              )}

              <div className="flex justify-end gap-2.5 mt-1">
                <button
                  type="submit"
                  disabled={submitting || (needsOtp && !otpVerified)}
                  className="px-4 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Saving...' : 'Set password'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-[15px] py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default SetPasswordModal;