import mongoose, { Schema, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import Session from '../models/sessionModel.js';
import OTP from '../models/otpModel.js';
import { sendOtpService } from '../services/sendOtpService.js';
const ROLE_RANKS = {
  User: 0,
  Manager: 1,
  Admin: 2,
  Owner: 3,
};
export const register = async (req, res, next) => {
  const { name, email, password, otp } = req.body;
  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
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
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user?.isDeleted) {
      return res.status(403).json({
        error: 'Your account has been deleted. Contact app owner to recover.',
      });
    }
    if (!user) {
      return res.status(404).json({ error: 'Invalid Credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Invalid Credentials' });
    }
    const allSessions = await Session.find({ userId: user._id });
    if (allSessions.length >= 3) {
      await allSessions[0].deleteOne();
    }
    const result = await sendOtpService(email);
    const session = await Session.create({ userId: user._id });
    res.json({ message: result });
  } catch (error) {
    res.json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  if (req.user.isDeleted) {
    return res.status(403).json({
      error: 'Your account has been deleted. Contact app owner to recover.',
    });
  }
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    picture: req.user.picture,
  });
};

export const logout = async (req, res) => {
  try {
    const sid = req.signedCookies.sid;
    await Session.findByIdAndDelete(sid);
    res.clearCookie('sid');
    res.status(204).end();
  } catch (error) {
    res.status(204).json({ message: 'Not logged out' });
  }
};
export const logoutById = async (req, res, next) => {
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

  try {
    await Session.deleteMany({ userId: req.params.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
export const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: 'You can not delete yourself.' });
  }
  try {
    await Session.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { isDeleted: true });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const permanentlyDeleteUser = async (req, res, next) => {
  const { userId } = req.params;
  if (req.user._id.toString() === userId) {
    return res.status(403).json({ error: 'You can not delete yourself.' });
  }
  try {
    await Session.deleteMany({ userId });
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
    const session = await Session.findById(sid);
    await Session.deleteMany({ userId: session.userId });
    res.clearCookie('sid');
    res.status(204).end();
  } catch (error) {
    res.status(204).json({ message: 'Not logged out' });
  }
};

export const getAllUsers = async (req, res) => {
  const users = await User.find({ isDeleted: false })
    .select('name email picture role')
    .lean();
  const userPromises = users.map(async (user) => {
    const session = await Session.findOne({ userId: user._id }).select('_id');
    user.isLoggedIn = !!session;
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
  try {
    await User.findByIdAndUpdate(userId, { isDeleted: false });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const changeUserRole = async (req, res, next) => {
  const { userId } = req.params;
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
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
