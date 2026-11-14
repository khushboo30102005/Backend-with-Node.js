import nodemailer from 'nodemailer';
import { OTP_TTL_SECONDS } from './otpService.js';

// Emails an already-generated OTP. Storage/hashing lives in otpService.js;
// the plaintext code exists only in memory and in the email itself.
export async function sendOtpEmail(email, otp) {
  const html = `
      <div style="font-family: sans-serif">
      <h1>Hello</h1>
      <h2>Your StorageApp verification code is: ${otp}.</h2>
      <p>This code will expire in ${OTP_TTL_SECONDS / 60} minutes.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
      <p>Thanks, The StorageApp Team.</p>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Storage App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'StorageApp Verification Code',
      html,
    });
    return { success: true, message: `OTP sent successfully on ${email}.` };
  } catch (error) {
    console.log(error.message);
    return { success: false, message: 'Could not send the OTP email.' };
  }
}
