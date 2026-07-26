import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create a transporter using SMTP
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
    to: process.env.SMTP_RECEIVER,
    subject: 'Storage App OTP',
    html: '<h2>Your OTP is 8934</h2>',
  });

  console.log('Message sent: %s', info.messageId);
} catch (error) {
  console.log(error.message);
}
