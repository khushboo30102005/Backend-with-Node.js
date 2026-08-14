import { axiosWithCreds, axiosWithoutCreds } from './axiosInstances';

export const sendOtp = async (email) => {
  const { data } = await axiosWithoutCreds.post('/auth/send-otp', { email });
  return data;
};

export const verifyOtp = async (email, otp) => {
  const { data } = await axiosWithoutCreds.post('/auth/verify-otp', {
    email,
    otp,
  });
  return data;
};

// Login-flow OTP verification (distinct from registration's verify-otp above)
export const verifyLoginOtp = async (email, otp) => {
  const { data } = await axiosWithCreds.post('/auth/verify-login-otp', {
    email,
    otp,
  });
  return data;
};

export const loginWithGoogle = async (idToken) => {
  const { data } = await axiosWithCreds.post('/auth/google', { idToken });
  return data;
};