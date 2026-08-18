import OTP from '../models/otpModel.js';
import nodemailer from 'nodemailer';
export async function sendOtpService(email) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  await OTP.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true },
  );
  const html = `
      <div style="font-family: sans-serif">
      <h1>Hello</h1>
      <h2>Your StorageApp verification code is: ${otp}.</h2>
      <p>This code will expire in 10 minutes.</p>
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
    const info = await transporter.sendMail({
      from: `"Storage App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'StorageApp Verification Code',
      html,
    });
    return { success: true, message: `OTP sent successfully on ${email}.` };
  } catch (error) {
    console.log(error.message);
  }
}
