import mongoose, { Schema, Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import User from '../models/userMonde.js'
import Directory from '../models/directoryModel.js'
import File from '../models/fileModel.js'
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const foundUser = await User.findOne({ email }).lean();
  if (foundUser) {
    return res.status(409).json({
      error: 'User already exists',
      message:
        'A user with this email address already exists. Please try logging in or use a different email.',
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
    console.log(err)
    await session.abortTransaction();
    if (err.code === 121) {
      return res
        .status(400)
        .json({ error: 'Invalid Field Values', message: err.errmsg });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password }).lean();
  if (!user) {
    return res.status(404).json({ error: 'Invalid Credentials' });
  }

  res.cookie('uid', user._id.toString(), {
    httpOnly: true,
    maxAge: 60 * 1000 * 60 * 24 * 7,
  });
  res.json({ message: 'logged in' });
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
};

export const logout = (req, res) => {
  res.clearCookie('uid');
  res.status(204).end();
};
