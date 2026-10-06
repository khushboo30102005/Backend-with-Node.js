import mongoose, { Types } from 'mongoose';
import Directory from '../models/directoryModel.js';
import OTP from '../models/otpModel.js';
import User from '../models/userModel.js';
import { verifyIdToken } from '../services/googleAuthService.js';
import { sendOtpService } from '../services/sendOtpService.js';
import redisClient from '../config/redis.js';
import { emailSchema, otpSchema, setPasswordWithOtpSchema} from '../validator/authSchema.js';
import * as z from 'zod';
import { setInitialPassword } from '../services/setPasswordService.js';

export const sendOTP = async (req, res, next) => {
  const { success, data } = emailSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  const { email } = data;
  const result = await sendOtpService(email);
  res.json(result);
};

export const verifyOTP = async (req, res, next) => {
  const { success, data } = otpSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  const { email, otp } = data;
  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  return res.json({ message: 'OTP Verified' });
};

export const verifyLoginOTP = async (req, res, next) => {
  const { success, data } = otpSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  const { email, otp } = data;
  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: 'User not found.',
      });
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
    res.cookie('sid', sessionId, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      maxAge: sessionExpiryTime,
    });
    await otpRecord.deleteOne();
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

      if (!user.picture?.includes('googleusercontent.com')) {
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
      res.cookie('sid', sessionId, {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        maxAge: sessionExpiryTime * 1000,
      });

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
        maxStorageInBytes: 1 * 1024 ** 3,
      });

      // Redis uses seconds
      const sessionExpiryTime = 60 * 60 * 24 * 7;

      await redisClient.expire(redisKey, sessionExpiryTime);

      // Cookie uses milliseconds
      res.cookie('sid', sessionId, {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        maxAge: sessionExpiryTime * 1000,
      });

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
  const { email, otp, newPassword } = data;
  try {
    // 1. Prove ownership of the email first
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }
    // 2. Same rules as the logged-in flow (never overwrites)
    const user = await User.findOne({ email }).select('_id');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const result = await setInitialPassword(user._id, newPassword);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    await otpRecord.deleteOne(); // single use
    return res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
}