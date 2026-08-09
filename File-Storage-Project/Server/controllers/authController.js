import mongoose, { Types } from 'mongoose';
import Directory from '../models/directoryModel.js';
import OTP from '../models/otpModel.js';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import { verifyIdToken } from '../services/googleAuthService.js';
import { sendOtpService } from '../services/sendOtpService.js';

export const sendOTP = async (req, res, next) => {
  const { email } = req.body;
  const result = await sendOtpService(email);
  res.json(result);
};

export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  return res.json({ message: 'OTP Verified' });
};

export const verifyLoginOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  const otpRecord = await OTP.findOne({ email, otp });
  if (!otpRecord) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
  const user = await User.findOne({ email });
  const session = await Session.findOne({ userId: user.id });
  res.cookie('sid', session.id, {
    httpOnly: true,
    signed: true,
    maxAge: 60 * 1000 * 60 * 24 * 7,
  });
  await otpRecord.deleteOne();
  return res.json({ message: 'Logged in' });
};

export const loginWithGoogle = async (req, res, next) => {
  const { idToken } = req.body;
  const { sub, name, email, picture } = await verifyIdToken(idToken);
  const user = await User.findOne({ email }).select('-__v');
  if (user) {
    if (user.isDeleted) {
      return res.status(403).json({
        error: 'Your account has been deleted. Contact app owner to recover.',
      });
    }

    const allSessions = await Session.find({ userId: user.id });
    if (allSessions.length >= 2) {
      await allSessions[0].deleteOne();
    }

    if (!user.picture.includes('googleusercontent.com')) {
      user.picture = picture;
      await user.save();
    }

    const session = await Session.create({ userId: user._id });
    res.cookie('sid', session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    return res.json({ message: 'logged in' });
  }
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
      },
      { mongooseSession },
    );

    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        picture,
        rootDirId,
      },
      { mongooseSession },
    );

    const session = await Session.create({ userId: userId });
    res.cookie('sid', session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    mongooseSession.commitTransaction();
    res.status(201).json({ message: 'account created and logged in' });
  } catch (err) {
    console.log(err)
    mongooseSession.abortTransaction();
    next(err);
  }
};
