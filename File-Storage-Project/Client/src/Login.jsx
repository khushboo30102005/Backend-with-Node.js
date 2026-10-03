import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router';
import { loginWithGoogle, verifyLoginOtp } from './apis/authApi.js';
import { FaGithub } from 'react-icons/fa';
import { loginUser } from './apis/userApi.js';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [serverError, setServerError] = useState('');

  // OTP States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0 || otpVerified) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, otpVerified]);

  const resetOtpState = () => {
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError('');
    setCountdown(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setServerError('');

    if (name === 'email') {
      resetOtpState();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Step 1
  const handleLogin = async () => {
    setServerError('');
    try {
      setIsSending(true);
      await loginUser(formData);
      setOtpSent(true);
      setOtpError('');
      setCountdown(60);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Login failed.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2
  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError('Please enter OTP.');
      return;
    }
    try {
      setIsVerifying(true);
      await verifyLoginOtp(formData.email, otp);
      setOtpVerified(true);
      navigate('/');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Enter key submits whichever step is active
  const handleSubmit = (e) => {
    e.preventDefault();
    if (otpSent) {
      if (!isVerifying && !otpVerified && countdown > 0) handleVerifyOtp();
    } else if (!isSending) {
      handleLogin();
    }
  };

  const loginWithGitHub = () => {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
      redirect_uri: 'http://localhost:4000/auth/github/callback',
      scope: 'read:user user:email',
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 box-border border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 disabled:opacity-60 ${
      hasError ? 'border-danger' : 'border-border'
    }`;

  return (
    <div className="max-w-[400px] mx-auto my-[60px] p-8 bg-surface rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] border border-border font-sans">
      <h2 className="text-center mb-6 text-2xl font-bold tracking-tight text-text">
        Login
      </h2>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="relative mb-5">
          <label className="block mb-1.5 font-semibold text-[13px] text-gray-700">
            Email
          </label>
          <input
            className={inputClass(serverError)}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. jane@example.com"
            disabled={otpSent}
            required
          />
          {otpSent && (
            <button
              type="button"
              className="mt-1.5 text-xs text-primary font-semibold hover:underline"
              onClick={resetOtpState}
            >
              Use a different email
            </button>
          )}
        </div>

        {/* Password */}
        <div className="relative mb-5">
          <label className="block mb-1.5 font-semibold text-[13px] text-gray-700">
            Password
          </label>
          <input
            className={inputClass(serverError)}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={otpSent}
            required
          />
          {serverError && (
            <span className="absolute top-full left-0 mt-1 text-[0.72rem] text-danger whitespace-nowrap">
              {serverError}
            </span>
          )}
        </div>

        {/* Send OTP / Login */}
        {!otpSent && (
          <button
            type="submit"
            className="w-full mt-1 px-4 py-[11px] rounded-lg text-white text-sm font-semibold cursor-pointer transition-[background-color,transform] duration-150 bg-primary hover:bg-primary-hover hover:-translate-y-px disabled:bg-indigo-200 disabled:cursor-not-allowed disabled:translate-y-0"
            disabled={isSending}
          >
            {isSending ? 'Checking...' : 'Login'}
          </button>
        )}

        {/* OTP Section */}
        {otpSent && (
          <>
            <div className="relative mb-5">
              <label className="block mb-1.5 font-semibold text-[13px] text-gray-700">
                Enter OTP
              </label>
              <div className="relative">
                <input
                  className="w-full pr-[84px] px-3 py-2.5 box-border border border-border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 disabled:opacity-60"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={4}
                  placeholder="4-digit OTP"
                  disabled={otpVerified}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold leading-none rounded-md bg-primary text-white cursor-pointer transition-colors duration-150 hover:bg-primary-hover disabled:opacity-55 disabled:cursor-not-allowed"
                  onClick={handleLogin}
                  disabled={countdown > 0 || isSending}
                >
                  {countdown > 0 ? `${countdown}s` : 'Resend'}
                </button>
              </div>
              {otpError && (
                <span className="absolute top-full left-0 mt-1 text-[0.72rem] text-danger whitespace-nowrap">
                  {otpError}
                </span>
              )}
            </div>

            {/* Disabled style only on the non-verified branch so the
                "Verified" state stays green. */}
            <button
              type="submit"
              className={`w-full mt-1 px-4 py-[11px] rounded-lg text-white text-sm font-semibold transition-[background-color,transform] duration-150 ${
                otpVerified
                  ? 'bg-success cursor-default'
                  : 'bg-primary cursor-pointer hover:bg-primary-hover hover:-translate-y-px disabled:bg-indigo-200 disabled:cursor-not-allowed disabled:translate-y-0'
              }`}
              disabled={isVerifying || otpVerified || countdown === 0}
            >
              {isVerifying
                ? 'Verifying...'
                : otpVerified
                  ? 'Verified'
                  : countdown === 0
                    ? 'Expired'
                    : 'Verify OTP'}
            </button>
          </>
        )}
      </form>

      <p className="text-center mt-4 text-sm text-text-muted">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-primary font-semibold no-underline hover:underline hover:text-primary-hover"
        >
          Register
        </Link>
      </p>

      <div className="flex items-center justify-center my-6 text-text-muted text-[13px] before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
        <span className="px-3.5">or</span>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              await loginWithGoogle(credentialResponse.credential);
              navigate('/');
            } catch (err) {
              setServerError(
                err.response?.data?.error || 'Google login failed.',
              );
            }
          }}
          theme="filled_blue"
          text="continue_with"
          shape="pill"
          onError={() => {
            setServerError('Google login failed.');
          }}
          useOneTap
        />
      </div>

      <div>
        <button
          type="button"
          className="w-full max-w-[260px] h-10 mx-auto mt-2.5 flex items-center justify-center gap-2.5 bg-[#1a73e8] text-white border-none rounded-full text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-[#1765cc] active:bg-[#1557b0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1a73e8] focus-visible:outline-offset-2"
          onClick={loginWithGitHub}
        >
          <FaGithub size={18} />
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;