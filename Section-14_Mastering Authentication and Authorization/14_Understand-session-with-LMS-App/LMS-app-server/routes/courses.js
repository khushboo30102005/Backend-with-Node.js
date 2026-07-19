import express from 'express';
import Course from '../models/Course.js';
import Session from '../models/Session.js';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    console.log(req.signedCookies.sid)
    const session = await Session.findById(req.signedCookies.sid);
    if (!session) {
      const session = await Session.create({});
      res.cookie('sid', session.id, {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
    }
    res.json(courses);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});

export default router;
