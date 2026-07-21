import mongoose, { Schema, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import Directory from '../models/directoryModel.js';
import File from '../models/fileModel.js';
import Session from '../models/sessionModel.js';
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const foundUser = await User.findOne({ email }).lean();
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
    console.log(err);
    await session.abortTransaction();
    if (err.code === 121) {
      return res
        .status(400)
        .json({ error: 'Invalid Field Values', message: err.errmsg });
    } else if (err.code === 11000 && err.keyValue.email) {
      console.log(err);
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
    if (!user) {
      return res.status(404).json({ error: 'Invalid Credentials1' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Invalid Credentials2' });
    }
    const allSessions = await Session.find({ userId: user._id });
    if (allSessions.length >= 3) {
      await allSessions[0].deleteOne();
    }
    const session = await Session.create({ userId: user._id });
    res.cookie('sid', session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    res.json({ message: 'logged in' });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
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
