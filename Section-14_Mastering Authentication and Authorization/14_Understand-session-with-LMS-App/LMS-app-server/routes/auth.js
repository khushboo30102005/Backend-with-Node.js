import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Cart from '../models/Cart.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  const sid = req.signedCookies.sid;
  try {
    const { name, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const sid = req.signedCookies.sid;
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const session = await Session.findById(sid);
    if (session) {
      session.expires = Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30;
      session.userId = user._id;
      await session.save()
      const cart = await Cart.findOne({ userId: session.userId });
      if (!cart) {
        const result = await Cart.create({
          userId: user._id,
          courses: session.data.cart,
        });
      } else {
        const existingCourses = cart.courses;

        for (const guestCourse of session.data.cart) {
          const existing = existingCourses.find(
            (course) =>
              course.courseId.toString() === guestCourse.courseId.toString(),
          );

          if (existing) {
            existing.quantity += guestCourse.quantity;
          } else {
            existingCourses.push(guestCourse);
          }
        }

        await cart.save();
      }

      session.data = {};
      await session.save();
      res.cookie('sid', sid, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
      return res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      });
    }
    const newSession = await Session.create({});
    newSession.expires = Math.round(Date.now() / 1000) + 60 * 60 * 24 * 30;
    newSession.data = '';
    newSession.userId = user._id;
    console.log({newSession})

    await newSession.save();
    res.cookie('sid', newSession.id, {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const sid = req.signedCookies.sid;
    const session = await Session.findById(sid);
    if (!session || !session.userId) {
      return res.status(404).json({ error: 'User not logged in' });
    }
    if (session.expires <  Math.round(Date.now() / 1000)) {
       await Session.deleteOne();
      return res.status(404).json({ error: 'User not logged in' });
    }
    const user = await User.findById(session.userId).lean();
    res.json({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', async (req, res) => {
  const sid = req.signedCookies.sid;
  await Session.findByIdAndDelete(sid);
  res.json({ message: 'Logout Successfully' });
});
export default router;
