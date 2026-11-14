// One-time initial Owner setup.
//
// There is deliberately NO HTTP endpoint for this: the only entry point is
// the operator CLI (scripts/initOwner.js), so nothing reachable over the
// network can ever mint an Owner. Normal registration and Google sign-up
// always create a 'User'; after that only an existing Owner can appoint
// another Owner (utils/roles.js).
//
// Verification required before an Owner is created:
//   1. Server access: the CLI needs the server's .env (database, Redis, SMTP).
//   2. A setup token. Only its SHA-256 is configured, in
//      OWNER_SETUP_TOKEN_HASH, so reading the environment does not reveal
//      it. Without that variable the setup is disabled entirely.
//   3. A single-use emailed OTP proving control of the Owner email address
//      (the same Redis-backed, attempt-limited OTPs that registration uses).
//   4. A strong password (new accounts).
//
// One-time guarantee: the setup is available only while no Owner exists and
// the `owner-bootstrap` SystemState marker has never been written. The
// marker is inserted with a fixed _id inside the same transaction as the
// Owner and the audit entry, so concurrent runs cannot both succeed, and once
// written it disables the setup for good (even if the Owner is later
// removed directly in the database).
import crypto from 'node:crypto';
import { Types } from 'mongoose';
import * as z from 'zod';
import User from '../models/userModel.js';
import Directory from '../models/directoryModel.js';
import SystemState from '../models/systemStateModel.js';
import AuditLog from '../models/auditLogModel.js';
import { runInTransaction } from '../utils/transaction.js';
import { consumeEmailOtp, issueEmailOtp, otpFailureMessage } from './otpService.js';
import { sendOtpEmail } from './sendOtpService.js';
import { deleteAllSessionsForUser } from './delRedisSessionsService.js';
import { normalizeEmail } from '../utils/otpCrypto.js';
import { generateSetupToken, hashSetupToken } from '../utils/ownerSetupToken.js';

export const OWNER_BOOTSTRAP_ID = 'owner-bootstrap';
export const AUDIT_OWNER_INITIALIZED = 'owner.bootstrap.completed';
export const AUDIT_OWNER_DENIED = 'owner.bootstrap.denied';

export class OwnerSetupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OwnerSetupError';
    this.code = code;
  }
}

// ------------------------------------------------------------ setup token

export { generateSetupToken, hashSetupToken };

const configuredHash = () => {
  const raw = String(process.env.OWNER_SETUP_TOKEN_HASH ?? '').trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(raw) ? raw : null;
};

export const isSetupConfigured = () => configuredHash() !== null;

/** Constant-time comparison of the presented token against the configured hash. */
export function verifySetupToken(token) {
  const expected = configuredHash();
  if (!expected || typeof token !== 'string' || token.length === 0) return false;
  const a = Buffer.from(hashSetupToken(token), 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ------------------------------------------------------------ input policy

export const ownerPasswordSchema = z
  .string('Please enter a valid password.')
  .min(12, 'Owner password must be at least 12 characters long.')
  .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password cannot exceed 72 bytes.')
  .refine((p) => /[a-z]/.test(p), 'Password must contain a lowercase letter.')
  .refine((p) => /[A-Z]/.test(p), 'Password must contain an uppercase letter.')
  .refine((p) => /\d/.test(p), 'Password must contain a digit.')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'Password must contain a symbol.');

const emailField = z.email('Please enter a valid email.').max(254, 'Email is too long.');
const nameField = z
  .string('Please enter a valid name.')
  .trim()
  .min(3, 'Name should be at least 3 characters long.')
  .max(100, 'Name can be at most 100 characters.')
  .regex(/^[^<>]*$/, 'Name cannot contain HTML tags.');

const firstError = (error) => error.issues[0]?.message ?? 'Invalid input.';

/** Validates the details for a NEW Owner account. Returns normalized data. */
export function validateNewOwner({ name, email, password }) {
  const r = z
    .object({ name: nameField, email: emailField, password: ownerPasswordSchema })
    .safeParse({ name, email, password });
  if (!r.success) throw new OwnerSetupError('INVALID_INPUT', firstError(r.error));
  return { ...r.data, email: normalizeEmail(r.data.email) };
}

export function validateOwnerEmail(email) {
  const r = emailField.safeParse(email);
  if (!r.success) throw new OwnerSetupError('INVALID_INPUT', firstError(r.error));
  return normalizeEmail(r.data);
}

// ------------------------------------------------------------ audit helpers

const clip = (v, n) => String(v ?? '').slice(0, n);

function auditEntry(type, outcome, { targetUserId = null, email = '', detail = '', context = {} }) {
  return {
    type,
    outcome,
    actorId: null,
    targetUserId,
    targetEmail: clip(email, 320),
    detail: clip(detail, 255),
    source: clip(context.source || 'cli', 40),
    host: clip(context.host, 255),
    osUser: clip(context.osUser, 255),
  };
}

/** Records a refused attempt. Best effort: never masks the original error. */
async function auditDenied(err, email, context) {
  try {
    await AuditLog.create(
      auditEntry(AUDIT_OWNER_DENIED, 'denied', {
        email,
        detail: `${err.code}: ${err.message}`,
        context,
      }),
    );
  } catch (logErr) {
    console.error('[audit] could not record denied owner setup:', logErr.message);
  }
}

// ------------------------------------------------------------ status

/**
 * { available: true } only while the setup has never completed and no Owner
 * account exists. `reason` is 'completed' or 'owner-exists' otherwise.
 */
export async function getOwnerSetupStatus() {
  if (await SystemState.exists({ _id: OWNER_BOOTSTRAP_ID })) {
    return { available: false, reason: 'completed' };
  }
  if (await User.exists({ role: 'Owner' })) {
    return { available: false, reason: 'owner-exists' };
  }
  return { available: true, reason: null };
}

// An Owner already exists but the marker was never written (e.g. created by
// hand before this mechanism existed): write it so the setup stays closed.
async function sealIfOwnerExists() {
  try {
    const owner = await User.findOne({ role: 'Owner' }).select('_id').lean();
    if (!owner) return;
    await SystemState.create({
      _id: OWNER_BOOTSTRAP_ID,
      completedAt: new Date(),
      ownerId: owner._id,
    });
  } catch (err) {
    if (err?.code !== 11000) console.error('[owner-setup] could not seal:', err.message);
  }
}

const alreadyInitialized = () =>
  new OwnerSetupError(
    'ALREADY_INITIALIZED',
    'An Owner already exists. Initial Owner setup is permanently disabled.',
  );

async function assertSetupAllowed(setupToken) {
  if (!isSetupConfigured()) {
    throw new OwnerSetupError(
      'SETUP_DISABLED',
      'Owner setup is disabled: OWNER_SETUP_TOKEN_HASH is not configured.',
    );
  }
  if (!verifySetupToken(setupToken)) {
    throw new OwnerSetupError('INVALID_TOKEN', 'Invalid setup token.');
  }
  const status = await getOwnerSetupStatus();
  if (!status.available) {
    if (status.reason === 'owner-exists') await sealIfOwnerExists();
    throw alreadyInitialized();
  }
}

// ------------------------------------------------------------ step 1: OTP

/**
 * Checks the token and that setup is still open, then emails a single-use
 * OTP to the prospective Owner address.
 */
export async function requestOwnerVerification({ setupToken, email, context = {} }) {
  let normalized = normalizeEmail(email);
  try {
    await assertSetupAllowed(setupToken);
    normalized = validateOwnerEmail(email);
    const otp = await issueEmailOtp(normalized);
    const sent = await sendOtpEmail(normalized, otp);
    if (!sent.success) {
      throw new OwnerSetupError('EMAIL_FAILED', 'Could not send the verification email.');
    }
    return { email: normalized };
  } catch (err) {
    if (err instanceof OwnerSetupError) await auditDenied(err, normalized, context);
    throw err;
  }
}

// ------------------------------------------------------------ step 2: create

/**
 * Creates the first Owner (or, with `promoteExisting`, promotes the existing
 * account registered with that email). Re-checks everything step 1 checked,
 * consumes the OTP, then writes marker + Owner + audit entry atomically.
 */
export async function initializeOwner({
  setupToken,
  name,
  email,
  password,
  otp,
  promoteExisting = false,
  context = {},
}) {
  let normalized = normalizeEmail(email);
  try {
    await assertSetupAllowed(setupToken);
    normalized = validateOwnerEmail(email);

    const existing = await User.findOne({ email: normalized }).lean();
    if (existing?.isDeleted) {
      throw new OwnerSetupError(
        'ACCOUNT_DELETED',
        'The account with this email is deleted and cannot become the Owner.',
      );
    }
    if (existing && !promoteExisting) {
      throw new OwnerSetupError(
        'EMAIL_TAKEN',
        'An account with this email already exists. Re-run with --promote-existing to make it the Owner.',
      );
    }
    const details = existing ? null : validateNewOwner({ name, email, password });

    const otpResult = await consumeEmailOtp(normalized, String(otp ?? ''));
    if (!otpResult.ok) throw new OwnerSetupError('INVALID_OTP', otpFailureMessage(otpResult));

    const ownerId = existing ? existing._id : new Types.ObjectId();
    const result = existing
      ? await promote(existing, context)
      : await createOwner(ownerId, details, context);

    if (existing) {
      // The role is cached in each Redis session: end them so it refreshes.
      await deleteAllSessionsForUser(String(ownerId)).catch((err) =>
        console.error('[owner-setup] could not end sessions:', err.message),
      );
    }
    return result;
  } catch (err) {
    if (err instanceof OwnerSetupError) await auditDenied(err, normalized, context);
    throw err;
  }
}

// Claims the one-time marker. A duplicate key means someone else finished
// (or is finishing) the setup first.
async function claimMarker(ownerId) {
  try {
    await SystemState.create({ _id: OWNER_BOOTSTRAP_ID, completedAt: new Date(), ownerId });
  } catch (err) {
    if (err?.code === 11000) throw alreadyInitialized();
    throw err;
  }
  // Re-check inside the transaction: an Owner appointed between the status
  // check and here must still close the setup.
  if (await User.exists({ role: 'Owner' })) throw alreadyInitialized();
}

async function createOwner(ownerId, { name, email, password }, context) {
  const rootDirId = new Types.ObjectId();
  let wroteMarker = false;
  try {
    await runInTransaction(async () => {
      await claimMarker(ownerId);
      wroteMarker = true;
      await Directory.create({
        _id: rootDirId,
        name: `root-${email}`.slice(0, 100),
        parentDirId: null,
        userId: ownerId,
        path: [rootDirId],
      });
      // pre('save') hashes the password with bcrypt.
      await User.create({ _id: ownerId, name, email, password, rootDirId, role: 'Owner' });
      await AuditLog.create(
        auditEntry(AUDIT_OWNER_INITIALIZED, 'success', {
          targetUserId: ownerId,
          email,
          detail: 'Initial Owner account created.',
          context,
        }),
      );
    });
  } catch (err) {
    // With a transaction nothing was written. Without one (standalone
    // MongoDB fallback) undo our own partial writes so a failed run does not
    // leave the setup closed with no Owner. Filters only match what we wrote.
    if (wroteMarker) await undoPartial(ownerId, rootDirId, { userCreated: true });
    if (err?.code === 11000 && err?.keyValue?.email) {
      throw new OwnerSetupError('EMAIL_TAKEN', 'An account with this email already exists.');
    }
    throw err;
  }
  return { ownerId, email, promoted: false };
}

async function promote(existing, context) {
  let wroteMarker = false;
  try {
    await runInTransaction(async () => {
      await claimMarker(existing._id);
      wroteMarker = true;
      const r = await User.updateOne(
        { _id: existing._id, isDeleted: false },
        { $set: { role: 'Owner' } },
      );
      if (r.matchedCount !== 1) {
        throw new OwnerSetupError('ACCOUNT_DELETED', 'The account is no longer available.');
      }
      await AuditLog.create(
        auditEntry(AUDIT_OWNER_INITIALIZED, 'success', {
          targetUserId: existing._id,
          email: existing.email,
          detail: `Existing account promoted from ${existing.role} to Owner.`,
          context,
        }),
      );
    });
  } catch (err) {
    if (wroteMarker) {
      await undoPartial(existing._id, null, { previousRole: existing.role });
    }
    throw err;
  }
  return { ownerId: existing._id, email: existing.email, promoted: true };
}

async function undoPartial(ownerId, rootDirId, { userCreated = false, previousRole } = {}) {
  try {
    if (userCreated) await User.deleteOne({ _id: ownerId, role: 'Owner' });
    if (previousRole) {
      await User.updateOne({ _id: ownerId, role: 'Owner' }, { $set: { role: previousRole } });
    }
    if (rootDirId) await Directory.deleteOne({ _id: rootDirId, userId: ownerId });
    await SystemState.deleteOne({ _id: OWNER_BOOTSTRAP_ID, ownerId });
  } catch (err) {
    console.error('[owner-setup] could not undo a partial setup:', err.message);
  }
}
