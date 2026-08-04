import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { loginWithGoogle } from './apis/loginWithGoogle';

const Login = () => {
  const BASE_URL = 'http://localhost:4000';

  const [formData, setFormData] = useState({
    email: 'ks@gmail.com',
    password: 'abcd',
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
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setServerError('');

    if (name === 'email') {
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtpError('');
      setCountdown(0);
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

      const response = await fetch(`${BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpError('');
        setCountdown(60);
      } else {
        setServerError(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setServerError('Something went wrong.');
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

      const response = await fetch(`${BASE_URL}/auth/verify-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        navigate('/');
      } else {
        setOtpError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Something went wrong.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container">
      <h2 className="heading">Login</h2>
      <form className="form">
        {/* Email */}

        <div className="form-group">
          <label className="label">Email</label>

          <input
            className={`input ${serverError ? 'input-error' : ''}`}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={otpSent}
            required
          />
        </div>

        {/* Password */}

        <div className="form-group">
          <label className="label">Password</label>

          <input
            className={`input ${serverError ? 'input-error' : ''}`}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={otpSent}
            required
          />

          {serverError && <span className="error-msg">{serverError}</span>}
        </div>

        {/* Send OTP */}

        {!otpSent && (
          <button
            type="button"
            className="submit-button"
            onClick={handleLogin}
            disabled={isSending}
          >
            {isSending ? 'Checking...' : 'Login'}
          </button>
        )}

        {/* OTP Section */}

        {otpSent && (
          <>
            <div className="form-group">
              <label className="label">Enter OTP</label>

              <div className="otp-wrapper">
                <input
                  className="input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={4}
                  placeholder="4-digit OTP"
                />

                <button
                  type="button"
                  className="otp-button"
                  onClick={handleLogin}
                  disabled={countdown > 0 || isSending}
                >
                  {countdown > 0 ? `${countdown}s` : 'Resend'}
                </button>
              </div>

              {otpError && <span className="error-msg">{otpError}</span>}
            </div>

            <button
              type="button"
              className="submit-button"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpVerified}
            >
              {isVerifying
                ? 'Verifying...'
                : otpVerified
                  ? 'Verified'
                  : 'Verify OTP'}
            </button>
          </>
        )}
      </form>
      <p className="link-text">
        Don't have an account?
        <Link to="/register"> Register</Link>
      </p>
      <div className="or">
        <span>or</span>
      </div>
      <div className="google-login">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const data = await loginWithGoogle(credentialResponse.credential);
            if (data.error) {
              console.log(data);
              return;
            }
            navigate('/');
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

export default Login;
