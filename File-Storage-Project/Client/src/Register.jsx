import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle, sendOtp, verifyOtp } from './apis/authApi';
import { registerUser } from './apis/userApi';
export const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setServerError('');
      setOtpError('');
      setOtpSent(false);
      setOtpVerified(false);
      setCountdown(0);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0 || otpVerified) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, otpVerified]);

  // Send OTP handler

  const handleSendOtp = async () => {
    const { email } = formData;
    if (!email) {
      setOtpError('Please enter your email first.');
      return;
    }
    try {
      setIsSending(true);
      await sendOtp(email);
      setOtpSent(true);
      setCountdown(60);
      setOtpError('');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setIsSending(false);
    }
  };
  // Verify OTP handler
  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError('Please enter OTP.');
      return;
    }
    try {
      setIsVerifying(true);
      await verifyOtp(formData.email, otp);
      setOtpVerified(true);
      setOtpError('');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Final form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsSuccess(false);
    if (!otpVerified) {
      setOtpError('Please verify your email with OTP before registering.');
      return;
    }
    try {
      await registerUser({ ...formData, otp });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.error || 'Registration failed. Please try again.',
      );
    }
  };

  return (
    <div className="max-w-[400px] mx-auto my-[60px] p-8 bg-surface rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)] border border-border font-sans">
      <h2 className="text-center mb-6 text-2xl font-bold tracking-tight text-text">
        Register
      </h2>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="relative mb-5">
          <label
            htmlFor="name"
            className="block mb-1.5 font-semibold text-[13px] text-gray-700"
          >
            Name
          </label>
          <input
            className="w-full px-3 py-2.5 box-border border border-border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Jane Cooper"
            required
          />
        </div>

        {/* Email + Send OTP */}
        <div className="relative mb-5">
          <label
            htmlFor="email"
            className="block mb-1.5 font-semibold text-[13px] text-gray-700"
          >
            Email
          </label>
          <div className="relative">
            <input
              className={`w-full pr-[84px] px-3 py-2.5 box-border border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 ${
                serverError ? 'border-danger' : 'border-border'
              }`}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. jane@example.com"
              required
            />
            <button
              type="button"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold leading-none rounded-md bg-primary text-white cursor-pointer transition-colors duration-150 hover:bg-primary-hover disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={handleSendOtp}
              disabled={isSending || countdown > 0 || otpVerified}
            >
              {otpVerified
                ? 'Verified'
                : isSending
                  ? 'Sending...'
                  : countdown > 0
                    ? `${countdown}s`
                    : 'Send OTP'}
            </button>
          </div>
          {serverError && (
            <span className="absolute top-full left-0 mt-1 text-[0.72rem] text-danger whitespace-nowrap">
              {serverError}
            </span>
          )}
        </div>

        {/* OTP Input + Verify */}
        {otpSent && (
          <div className="relative mb-5">
            <label
              htmlFor="otp"
              className="block mb-1.5 font-semibold text-[13px] text-gray-700"
            >
              Enter OTP
            </label>
            <div className="relative">
              <input
                className="w-full pr-[84px] px-3 py-2.5 box-border border border-border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 disabled:opacity-60"
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="4-digit OTP"
                maxLength={4}
                disabled={otpVerified || countdown === 0}
                required
              />
              {otpError && (
                <span className="absolute top-full left-0 mt-1 text-[0.72rem] text-danger whitespace-nowrap">
                  {otpError}
                </span>
              )}
              <button
                type="button"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 px-2.5 py-1.5 text-xs font-semibold leading-none rounded-md bg-primary text-white cursor-pointer transition-colors duration-150 hover:bg-primary-hover disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={handleVerifyOtp}
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
            </div>
          </div>
        )}

        {/* Password */}
        <div className="relative mb-5">
          <label
            htmlFor="password"
            className="block mb-1.5 font-semibold text-[13px] text-gray-700"
          >
            Password
          </label>
          <input
            className="w-full px-3 py-2.5 box-border border border-border rounded-lg text-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full mt-1 px-4 py-[11px] rounded-lg text-white text-sm font-semibold cursor-pointer transition-[background-color,transform] duration-150 disabled:bg-indigo-200 disabled:cursor-not-allowed disabled:translate-y-0 ${
            isSuccess
              ? 'bg-success'
              : 'bg-primary hover:bg-primary-hover hover:-translate-y-px'
          }`}
          disabled={!otpVerified || isSuccess}
        >
          {isSuccess ? 'Registration Successful' : 'Register'}
        </button>
      </form>

      <p className="text-center mt-4 text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary font-semibold no-underline hover:underline hover:text-primary-hover"
        >
          Login
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
              console.log(err.response?.data);
            }
          }}
          theme="filled_blue"
          text="continue_with"
          onError={() => {
            console.log('Login Failed');
          }}
          useOneTap
        />
      </div>
    </div>
  );
};

export default Register;
