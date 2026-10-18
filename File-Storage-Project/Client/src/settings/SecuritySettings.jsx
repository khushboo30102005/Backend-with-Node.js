import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FaEye, FaEyeSlash, FaLaptop } from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import { changePassword, logoutAllSessions } from '../apis/userApi';
import { sendOtp } from '../apis/authApi';
import SetPasswordModal from '../components/SetPasswordModal';
import {
  SettingsSection,
  SettingsRow,
  Notice,
  inputClass,
  primaryBtn,
  secondaryBtn,
} from './SettingsUI';

function PasswordField({ id, label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-1.5 text-[13px] font-semibold text-text"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          className={`${inputClass} pr-11`}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-muted hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30"
        >
          {visible ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
        </button>
      </div>
    </div>
  );
}

// Change password, verified by an emailed code (the account has no
// "current password" field, so a code proves the person at the keyboard
// controls the mailbox — a stolen session alone can't take over the account).
function ChangePasswordForm({ email }) {
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSend() {
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the code.');
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!/^\d{4}$/.test(otp)) return setError('Enter the 4-digit code sent to your email.');
    if (newPassword.length < 4) return setError('Password must be at least 4 characters long.');
    if (newPassword.length > 72) return setError('Password cannot exceed 72 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setError('');
    setSubmitting(true);
    try {
      const data = await changePassword({ otp, newPassword, confirmPassword });
      setSuccess(data.message || 'Password changed.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      setCountdown(0); // the code is used up — stop the resend timer too
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="py-4 flex flex-col gap-3 max-w-md">
      {!otpSent ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] text-text-muted">
            For your security, we'll email a 4-digit code to {email} before you
            can change your password.
          </p>
          <button
            type="button"
            className={secondaryBtn}
            onClick={handleSend}
            disabled={sending || countdown > 0}
          >
            {sending ? 'Sending...' : countdown > 0 ? `Wait ${countdown}s` : 'Send code'}
          </button>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="cp-otp" className="block mb-1.5 text-[13px] font-semibold text-text">
              Verification code
            </label>
            <div className="flex gap-2">
              <input
                id="cp-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                className={inputClass}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <button
                type="button"
                className={`${secondaryBtn} flex-shrink-0`}
                onClick={handleSend}
                disabled={sending || countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : 'Resend'}
              </button>
            </div>
          </div>
          <PasswordField id="cp-new" label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <PasswordField id="cp-confirm" label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <div>
            <button type="submit" className={primaryBtn} disabled={submitting}>
              {submitting ? 'Saving...' : 'Change password'}
            </button>
          </div>
        </>
      )}
      {error && <Notice>{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}
    </form>
  );
}

function SecuritySettings() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function handleLogoutAll() {
    if (!confirm('Sign out of every device, including this one?')) return;
    setSigningOut(true);
    setError('');
    try {
      await logoutAllSessions();
      navigate('/login');
    } catch {
      setError('Could not sign out of all devices.');
      setSigningOut(false);
    }
  }

  const hasPassword = user?.hasPassword;

  return (
    <>
      {hasPassword === false && (
        <Notice kind="info">
          Add a password to your account so you can also sign in with your email
          and password, not just Google.
        </Notice>
      )}

      <SettingsSection
        title="Password"
        description={
          hasPassword
            ? 'Change the password you use to sign in.'
            : 'Your account was created with Google and has no password yet.'
        }
      >
        {hasPassword ? (
          <ChangePasswordForm email={user.email} />
        ) : (
          <div className="py-4">
            <button className={primaryBtn} onClick={() => setShowSetPassword(true)}>
              Set password
            </button>
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Sign-in methods">
        <SettingsRow label="Email & password">
          <span className={hasPassword ? 'text-success font-medium' : 'text-text-muted'}>
            {hasPassword ? 'Enabled' : 'Not set'}
          </span>
        </SettingsRow>
        <SettingsRow label="Google" hint="Signing in with Google uses your account's email.">
          <span className="text-text-muted">Available when your Google email matches</span>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Devices & sessions"
        description="A per-device list (browser, location, last active) isn't available yet — the server doesn't record that information."
      >
        <div className="py-4 flex flex-col items-start gap-2">
          {error && <Notice>{error}</Notice>}
          <button className={secondaryBtn} onClick={handleLogoutAll} disabled={signingOut}>
            <span className="inline-flex items-center gap-2">
              <FaLaptop size={13} />
              {signingOut ? 'Signing out...' : 'Sign out of all devices'}
            </span>
          </button>
        </div>
      </SettingsSection>

      {showSetPassword && (
        <SetPasswordModal onClose={() => setShowSetPassword(false)} onSuccess={refreshUser} />
      )}
    </>
  );
}

export default SecuritySettings;