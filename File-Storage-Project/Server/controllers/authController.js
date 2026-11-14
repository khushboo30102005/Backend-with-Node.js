import mongoose, { Types } from 'mongoose';
import Directory from '../models/directoryModel.js';
import User from '../models/userModel.js';
import { verifyIdToken } from '../services/googleAuthService.js';
import { sendOtpEmail } from '../services/sendOtpService.js';
import {
  checkEmailOtp,
  consumeEmailOtp,
  consumePendingLogin,
  issueEmailOtp,
  otpFailureMessage,
} from '../services/otpService.js';
import redisClient from '../config/redis.js';
import { emailSchema, otpSchema, setPasswordWithOtpSchema} from '../validator/authSchema.js';
import * as z from 'zod';
import { setInitialPassword } from '../services/setPasswordService.js';
import {
  clearSessionCookieOptions,
  PENDING_LOGIN_COOKIE,
  sessionCookieOptions,
} from '../config/cookie.js';
import { getFreeStorageBytes } from '../config/plans.js';
import { isStoredAvatar } from '../utils/avatar.js';
import { normalizeEmail } from '../utils/otpCrypto.js';

const DELETED_ACCOUNT_ERROR =
  'Your account has been deleted. Contact app owner to recover.';

export const sendOTP = async (req, res, next) => {
  const { success, data } = emailSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const email = normalizeEmail(data.email);
  try {
    // Deleted accounts may not receive codes (registration with a new email
    // still works: no user is found).
    const existing = await User.findOne({ email }).select('isDeleted').lean();
    if (existing?.isDeleted) {
      return res.status(403).json({ error: DELETED_ACCOUNT_ERROR });
    }
    const otp = await issueEmailOtp(email);
    const result = await sendOtpEmail(email, otp);
    if (!result.success) return res.status(502).json({ error: result.message });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req, res, next) => {
  const { success, data } = otpSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  const email = normalizeEmail(data.email);
  try {
    const existing = await User.findOne({ email }).select('isDeleted').lean();
    if (existing?.isDeleted) {
      return res.status(403).json({ error: DELETED_ACCOUNT_ERROR });
    }
    // Pre-check only: the code stays valid for the final register /
    // set-password submit, which consumes it. Wrong guesses still count.
    const result = await checkEmailOtp(email, data.otp);
    if (!result.ok) {
      return res.status(400).json({ error: otpFailureMessage(result) });
    }
    return res.json({ message: 'OTP Verified' });
  } catch (err) {
    next(err);
  }
};

// Step 2 of password login. Requires the pending-login cookie issued by
// POST /user/login after a correct password; an OTP alone is not enough.
export const verifyLoginOTP = async (req, res, next) => {
  const { success, data } = otpSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  const { email, otp } = data;
  try {
    const token = req.signedCookies?.[PENDING_LOGIN_COOKIE];
    if (!token) {
      return res.status(401).json({
        error: 'Login session expired. Please sign in with your password again.',
      });
    }
    const result = await consumePendingLogin(token, email, otp);
    if (!result.ok) {
      if (result.reason === 'locked') {
        res.clearCookie(PENDING_LOGIN_COOKIE, clearSessionCookieOptions);
      }
      return res.status(400).json({ error: otpFailureMessage(result) });
    }
    res.clearCookie(PENDING_LOGIN_COOKIE, clearSessionCookieOptions);

    // Re-check the account: it may have been deleted (or its email changed)
    // between the password step and now.
    const user = await User.findById(result.userId);
    if (!user || normalizeEmail(user.email) !== normalizeEmail(email)) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' });
    }
    if (user.isDeleted) {
      return res.status(403).json({ error: DELETED_ACCOUNT_ERROR });
    }

    // Keep at most 2 concurrent sessions. Done here, after both factors,
    // so a correct password alone can no longer evict a signed-in device.
    const allSessions = await redisClient.ft.search(
      'userIdIdx',
      `@userId:{${user.id}}`,
      { RETURN: [] },
    );
    if (allSessions.total >= 2) {
      await redisClient.del(allSessions.documents[0].id);
    }

    const sessionId = crypto.randomUUID();
    const redisKey = `session:${sessionId}`;

    await redisClient.json.set(redisKey, '$', {
      userId: user._id,
      rootDirId: user.rootDirId,
      role: user.role,
      maxStorageInBytes: user.maxStorageInBytes,
    });

    const sessionExpiryTime = 60 * 1000 * 60 * 24 * 7;
    await redisClient.expire(redisKey, sessionExpiryTime / 1000);
    res.cookie('sid', sessionId, sessionCookieOptions(sessionExpiryTime));
    return res.json({ message: 'Logged in' });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const { sub, name, email, picture } = await verifyIdToken(idToken);

    const user = await User.findOne({ email }).select('-__v');

    // Existing user
    if (user) {
      if (user.isDeleted) {
        return res.status(403).json({
          error: 'Your account has been deleted. Contact app owner to recover.',
        });
      }
      const allSessions = await redisClient.ft.search(
        'userIdIdx',
        `@userId:{${user.id}}`,
        {
          RETURN: [],
        },
      );

      if (allSessions.total >= 2) {
        await redisClient.del(allSessions.documents[0].id);
      }

      // Keep a picture the user uploaded themselves (a B2 key); otherwise
      // keep syncing the Google photo as before.
      if (
        !isStoredAvatar(user.picture) &&
        !user.picture?.includes('googleusercontent.com')
      ) {
        user.picture = picture;
        await user.save();
      }

      // Create Redis session
      const sessionId = crypto.randomUUID();
      const redisKey = `session:${sessionId}`;

      await redisClient.json.set(redisKey, '$', {
        userId: user._id.toString(),
        rootDirId: user.rootDirId.toString(),
        role: user.role,
        maxStorageInBytes: user.maxStorageInBytes,
      });

      // Redis EXPIRE uses seconds
      const sessionExpiryTime = 60 * 60 * 24 * 7;

      await redisClient.expire(redisKey, sessionExpiryTime);

      // Cookie maxAge uses milliseconds
      res.cookie('sid', sessionId, sessionCookieOptions(sessionExpiryTime * 1000));

      return res.json({
        message: 'logged in',
      });
    }

    // New user
    const mongooseSession = await mongoose.startSession();

    try {
      const rootDirId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      mongooseSession.startTransaction();

      await Directory.insertOne(
        {
          _id: rootDirId,
          name: `root-${email}`,
          parentDirId: null,
          userId,
          path: [rootDirId],
        },
        {
          session: mongooseSession,
        },
      );

      await User.insertOne(
        {
          _id: userId,
          name,
          email,
          picture,
          rootDirId,
        },
        {
          session: mongooseSession,
        },
      );

      await mongooseSession.commitTransaction();

      // Create Redis session AFTER MongoDB transaction succeeds
      const sessionId = crypto.randomUUID();
      const redisKey = `session:${sessionId}`;

      await redisClient.json.set(redisKey, '$', {
        userId: userId.toString(),
        rootDirId: rootDirId.toString(),
        role: 'User',
        maxStorageInBytes: getFreeStorageBytes(),
      });

      // Redis uses seconds
      const sessionExpiryTime = 60 * 60 * 24 * 7;

      await redisClient.expire(redisKey, sessionExpiryTime);

      // Cookie uses milliseconds
      res.cookie('sid', sessionId, sessionCookieOptions(sessionExpiryTime * 1000));

      return res.status(201).json({
        message: 'account created and logged in',
      });
    } catch (err) {
      if (mongooseSession.inTransaction()) {
        await mongooseSession.abortTransaction();
      }
      throw err;
    } finally {
      await mongooseSession.endSession();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


export const setPasswordWithOtp = async (req, res, next) => {
  const { success, data, error } = setPasswordWithOtpSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      error: Object.values(z.flattenError(error).fieldErrors).flat()[0],
    });
  }
  const { otp, newPassword } = data;
  const email = normalizeEmail(data.email);
  try {
    // 1. Prove ownership of the email first (single use: consumed here)
    const otpResult = await consumeEmailOtp(email, otp);
    if (!otpResult.ok) {
      return res.status(400).json({ error: otpFailureMessage(otpResult) });
    }
    // 2. Same rules as the logged-in flow (never overwrites)
    const user = await User.findOne({ email }).select('_id isDeleted');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isDeleted) {
      return res.status(403).json({ error: DELETED_ACCOUNT_ERROR });
    }

    const result = await setInitialPassword(user._id, newPassword);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}