import mongoose, { Schema, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import * as z from 'zod';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import OTP from '../models/otpModel.js';
import { sendOtpService } from '../services/sendOtpService.js';
import redisClient from '../config/redis.js';
import { deleteAllSessionsForUser } from '../services/delRedisSessionsService.js';
import { loginSchema, registerSchema } from '../validator/authSchema.js';
const ROLE_RANKS = {
  User: 0,
  Manager: 1,
  Admin: 2,
  Owner: 3,
};

export const register = async (req, res, next) => {
  const { success, data, error } = registerSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: z.flattenError(error).fieldErrors });
  }
  const { name, email, password, otp } = data;
  const otpRecord = await OTP.findOne({ email, otp });
  console.log(otpRecord);
  if (!otpRecord) {
    console.log(z.fla);
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  await otpRecord.deleteOne();
  const foundUser = await User.findOne({ email }).lean();
  if (foundUser?.isDeleted) {
    return res.status(403).json({
      error: 'Your account has been deleted. Contact app owner to recover.',
    });
  }
  const session = await mongoose.startSession();
  try {
    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    session.startTransaction();
    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        password,
        rootDirId,
      },
      { session },
    );
    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { session },
    );
    await session.commitTransaction();
    res.status(201).json({ message: 'User Registered' });
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 121) {
      return res
        .status(400)
        .json({ error: 'Invalid Field Values', message: err.errmsg });
    } else if (err.code === 11000 && err.keyValue.email) {
      return res.status(409).json({
        error: 'User with this email already exists',
        message:
          'A user with this email address already exists. Please try logging in or use a different email.',
      });
    } else {
      next(err);
    }
  }
};

export const login = async (req, res, next) => {
  const { success, data } = loginSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid Credentials' });
  }

  const { email, password } = data;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'Invalid Credentials' });
    }

    if (user?.isDeleted) {
      return res.status(403).json({
        error: 'Your account has been deleted. Contact app owner to recover.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Invalid Credentials' });
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

    const result = await sendOtpService(email);

    res.json({ message: result });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.isDeleted) {
    return res.status(403).json({
      error: 'Your account has been deleted. Contact app owner to recover.',
    });
  }
  res.status(200).json({
    name: user.name,
    email: user.email,
    role: user.role,
    picture: user.picture,
  });
};

export const logout = async (req, res) => {
  try {
    const sid = req.signedCookies.sid;
    await redisClient.del(`session:${sid}`);
    res.clearCookie('sid');
    res.status(204).end();
  } catch (error) {
    res.status(204).json({ message: 'Not logged out' });
  }
};

export const logoutById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const actorRole = req.user.role;
    const targetRole = targetUser.role;

    const blocked =
      (actorRole === 'Manager' &&
        (targetRole === 'Admin' || targetRole === 'Owner')) ||
      (actorRole === 'Admin' && targetRole === 'Owner');

    if (blocked) {
      return res.status(403).json({ error: 'You cannot logout this user.' });
    }

    await deleteAllSessionsForUser(req.params.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: 'You can not delete yourself.' });
  }
  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (ROLE_RANKS[req.user.role] < ROLE_RANKS[targetUser.role]) {
      return res.status(403).json({ error: 'You cannot delete this user.' });
    }
    await deleteAllSessionsForUser(userId);
    await User.findByIdAndUpdate(userId, { isDeleted: true });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const permanentlyDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: 'You can not delete yourself.' });
  }
  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (ROLE_RANKS[req.user.role] < ROLE_RANKS[targetUser.role]) {
      return res.status(403).json({ error: 'You cannot delete this user.' });
    }
    await deleteAllSessionsForUser(userId);
    await File.deleteMany({ userId });
    await Directory.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const logoutAll = async (req, res) => {
  try {
    const sid = req.signedCookies.sid;
    const result = await redisClient.json.get(`session:${sid}`, {
      path: '$.userId',
    });

    if (!result) {
      res.clearCookie('sid');
      return res.status(204).end();
    }

    const userId = result[0];
    await deleteAllSessionsForUser(userId);
    res.clearCookie('sid');
    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to logout from all sessions' });
  }
};

export const getAllUsers = async (req, res) => {
  const users = await User.find({ isDeleted: false })
    .select('name email picture role')
    .lean();
  const userPromises = users.map(async (user) => {
    const result = await redisClient.ft.search(
      'userIdIdx',
      `@userId:{${user._id}}`,
      { RETURN: [], LIMIT: { from: 0, size: 1 } },
    );
    user.isLoggedIn = result.total > 0;
  });
  await Promise.all(userPromises);
  res.json(users);
};

export const getDeletedUsers = async (req, res) => {
  const users = await User.find({ isDeleted: true })
    .select('name email picture role')
    .lean();
  res.json(users);
};

export const recoverUser = async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    await User.findByIdAndUpdate(userId, { isDeleted: false });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const changeUserRole = async (req, res, next) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  const { role: newRole } = req.body;

  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: 'You cannot change your own role.' });
  }

  if (!(newRole in ROLE_RANKS)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const actorRank = ROLE_RANKS[req.user.role];
    const targetRank = ROLE_RANKS[targetUser.role];
    const newRoleRank = ROLE_RANKS[newRole];

    if (actorRank < targetRank) {
      return res
        .status(403)
        .json({ error: 'You cannot change the role of this user.' });
    }

    if (newRoleRank > actorRank) {
      return res
        .status(403)
        .json({ error: 'You cannot assign a role higher than your own.' });
    }

    await User.findByIdAndUpdate(userId, { role: newRole });

    await deleteAllSessionsForUser(userId);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
