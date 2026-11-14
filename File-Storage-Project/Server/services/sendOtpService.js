import nodemailer from 'nodemailer';
import { OTP_TTL_SECONDS } from './otpService.js';
import { BRAND_NAME, BRAND_FULL_NAME, BRAND_TAGLINE } from '../config/brand.js';

// Emails an already-generated OTP. Storage/hashing lives in otpService.js;
// the plaintext code exists only in memory and in the email itself.
//
// Bounded time: without explicit timeouts nodemailer waits up to 2 minutes for
// a connection that never opens, which leaves the login / send-otp request
// pending in the browser (and past the Vercel proxy's patience). Every phase
// now has its own timeout, and the whole send has a hard deadline that aborts
// the SMTP connection, so this function always resolves quickly with
// { success: false } and the callers answer 502.

export const EMAIL_TIMEOUT_DEFAULTS = Object.freeze({
  connectionMs: 10_000, // TCP + TLS connect (and, in nodemailer 10, the greeting wait)
  greetingMs: 10_000, // server greeting after the socket is open
  socketMs: 15_000, // inactivity on an established connection
  sendMs: 20_000, // hard cap on the entire sendMail() call
});
const MAX_TIMEOUT_MS = 60_000;

const ENV_KEYS = {
  connectionMs: 'SMTP_CONNECTION_TIMEOUT_MS',
  greetingMs: 'SMTP_GREETING_TIMEOUT_MS',
  socketMs: 'SMTP_SOCKET_TIMEOUT_MS',
  sendMs: 'SMTP_SEND_TIMEOUT_MS',
};

// Read at call time so ops can tune them on Render without a code change.
// Anything that is not a positive integer up to MAX_TIMEOUT_MS is ignored.
export function emailTimeouts(env = process.env) {
  const out = {};
  for (const [name, key] of Object.entries(ENV_KEYS)) {
    const raw = String(env[key] ?? '').trim();
    const value = /^\d+$/.test(raw) ? Number(raw) : NaN;
    out[name] =
      value > 0 && value <= MAX_TIMEOUT_MS ? value : EMAIL_TIMEOUT_DEFAULTS[name];
  }
  return out;
}

// ------------------------------------------------------------------ logging

const MAX_LOG_MESSAGE = 300;
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Error text from SMTP servers can echo addresses back; make sure it never
// carries credentials, the OTP or anyone's email address into the logs.
export function sanitizeErrorMessage(message, { secrets = [] } = {}) {
  let text = String(message ?? '');
  for (const secret of secrets) {
    if (typeof secret !== 'string' || secret.length < 4) continue;
    for (const variant of new Set([secret, secret.replace(/\s+/g, '')])) {
      if (variant.length >= 4) {
        text = text.replace(new RegExp(escapeRegExp(variant), 'gi'), '[redacted]');
      }
    }
  }
  text = text
    .replace(/[^\s<>"'@,;:()]+@[^\s<>"'@,;:()]+/g, '[email]')
    .replace(/\b\d{6,}\b/g, '[redacted]') // OTPs are 6 digits
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_LOG_MESSAGE ? `${text.slice(0, MAX_LOG_MESSAGE)}…` : text;
}

const recipientDomain = (email) => {
  const at = String(email ?? '').lastIndexOf('@');
  return at > 0 ? String(email).slice(at + 1).toLowerCase() : null;
};

// One JSON line per attempt, easy to search for in Render's logs:
//   {"event":"otp_email","status":"failed","code":"ETIMEDOUT",...}
function logAttempt(fields) {
  const line = JSON.stringify({ event: 'otp_email', ...fields });
  if (fields.status === 'sent') console.log(line);
  else console.error(line);
}

// ------------------------------------------------------------------ sending

export async function sendOtpEmail(email, otp) {
  const html = `
      <div style="font-family: sans-serif">
      <h1>Hello</h1>
      <h2>Your ${BRAND_NAME} verification code is: ${otp}.</h2>
      <p>This code will expire in ${OTP_TTL_SECONDS / 60} minutes.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
      <p>Thanks, The ${BRAND_NAME} Team.</p>
      <p style="color: #64748b; font-size: 12px">${BRAND_NAME} — ${BRAND_FULL_NAME}<br />${BRAND_TAGLINE}</p>
    </div>
  `;

  const timeouts = emailTimeouts();
  const startedAt = Date.now();
  const controller = new AbortController();
  let transporter;
  let timer;

  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: timeouts.connectionMs,
      greetingTimeout: timeouts.greetingMs,
      socketTimeout: timeouts.socketMs,
    });

    const sending = transporter.sendMail({
      from: `"${BRAND_NAME}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${BRAND_NAME} Verification Code`,
      html,
      // nodemailer >= 10.5 closes the SMTP connection when this aborts.
      signal: controller.signal,
    });
    sending.catch(() => {}); // may still reject after the deadline won the race

    // Backstop that does not rely on the transport honouring the signal.
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        const err = new Error(`OTP email not sent within ${timeouts.sendMs} ms`);
        err.code = 'ESENDTIMEOUT';
        reject(err);
      }, timeouts.sendMs);
    });

    await Promise.race([sending, deadline]);

    logAttempt({
      status: 'sent',
      durationMs: Date.now() - startedAt,
      recipientDomain: recipientDomain(email),
    });
    return { success: true, message: `OTP sent successfully on ${email}.` };
  } catch (error) {
    const timedOut = controller.signal.aborted;
    logAttempt({
      status: 'failed',
      code: timedOut ? 'ESENDTIMEOUT' : error?.code || 'UNKNOWN',
      responseCode: error?.responseCode ?? null,
      command: error?.command ?? null,
      permanent: typeof error?.permanent === 'boolean' ? error.permanent : null,
      timedOut,
      durationMs: Date.now() - startedAt,
      timeoutsMs: timeouts,
      recipientDomain: recipientDomain(email),
      message: sanitizeErrorMessage(error?.message, {
        secrets: [process.env.SMTP_PASS, process.env.SMTP_USER, otp, email],
      }),
    });
    return { success: false, message: 'Could not send the OTP email.' };
  } finally {
    clearTimeout(timer);
    try {
      transporter?.close();
    } catch {
      // nothing to release
    }
  }
}
