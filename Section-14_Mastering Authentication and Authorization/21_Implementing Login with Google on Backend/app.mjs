import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {
  fetchUserFromGoogle,
  generateGoogleAuthURL,
} from './services/googleAuth-service.mjs';
import passport from 'passport';
import './passport.mjs';
import { writeFile } from 'fs/promises';
import users from './usersDB.json' with { type: 'json' };
import sessions from './sessionsDB.json' with { type: 'json' };
const app = express();
app.use(cookieParser());
const port = 4000;
app.use(
  cors({
    origin: 'http://localhost:5500',
    credentials: true,
  }),
);

app.use(express.json());

app.get('/profile', (req, res) => {
  const { sid } = req.cookies;
  const existingSession = sessions.find(({ id }) => id === sid);
  if (!existingSession) {
    return res.status(401).json({ message: 'User not logged in' });
  }
  const existingUser = users.find(({ id }) => id === existingSession.userID);
  if (!existingUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: existingUser });
});

//Generate Auth URL and Redirect

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile', 'openid'], prompt: 'consent' }),
);

/* app.get('/auth/google', (req, res) => {
  const googleAuthURL = generateGoogleAuthURL();
  res.redirect(googleAuthURL);
  res.end();
}); */

app.post('/logout', async (req, res) => {
  const { sid } = req.cookies;
  const existingSessionIndex = sessions.findIndex(({ id }) => id === sid);
  if (existingSessionIndex !== -1) {
    sessions.splice(existingSessionIndex, 1);
    await writeFile('sessionsDB.json', JSON.stringify(sessions), null, 2);
  }
  res.clearCookie('sid');
  res.status(204).json({ message: 'User logged out successfully' });
});

app.get('/session-cookie', async (req, res) => {
  const { sid } = req.query;
  res.cookie('sid', sid, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  });
  res.end();
});

// Extract auth code and exchange for IdToken:
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:5500/callback.html?error=true',
    session: false,
  
  }),
  async (req, res) => {
    const { sub, name, email, picture } = req.user._json;
    const newUser = {
      id: sub,
      name,
      email,
      picture,
    };

    const existingUser = users.find(({ id }) => id === sub);
    const existingSessionIndex = sessions.findIndex(
      ({ userID }) => userID === sub,
    );

    const sessionID = crypto.randomUUID();

    if (existingUser) {
      if (existingSessionIndex === -1) {
        sessions.push({ id: sessionID, userID: sub });
      } else {
        sessions[existingSessionIndex].id = sessionID;
      }
      await writeFile('sessionsDB.json', JSON.stringify(sessions), null, 2);
      res.redirect(`http://localhost:5500/callback.html?sid=${sessionID}`);
      return res.end();
    }

    users.push(newUser);
    await writeFile('usersDB.json', JSON.stringify(users), null, 2);
    if (existingSessionIndex === -1) {
      sessions.push({ id: sessionID, userID: sub });
    } else {
      sessions[existingSessionIndex].id = sessionID;
    }
    await writeFile('sessionsDB.json', JSON.stringify(sessions), null, 2);
    res.redirect(`http://localhost:5500/callback.html?sid=${sessionID}`);
    return res.end();
  },
);

/* app.get('/auth/google/callback', async (req, res) => {
  const { sid } = req.cookies;
  const existingSession = sessions.find(({ id }) => id === sid);
  if (existingSession) {
    return res.json({ message: 'User already logged in' });
  }
  const { code } = req.query;
  if (code) {
    const { sub, name, email, picture } = await fetchUserFromGoogle(code);
    const newUser = {
      id: sub,
      name,
      email,
      picture,
    };

    const existingUser = users.find(({ id }) => id === sub);
    const existingSessionIndex = sessions.findIndex(
      ({ userID }) => userID === sub,
    );

    const sessionID = crypto.randomUUID();

    if (existingUser) {
      if (existingSessionIndex === -1) {
        sessions.push({ id: sessionID, userID: sub });
      } else {
        sessions[existingSessionIndex].id = sessionID;
      }
      await writeFile('sessionsDB.json', JSON.stringify(sessions), null, 2);
      res.redirect(`http://localhost:5500/callback.html?sid=${sessionID}`);
      return res.end();
    }

    users.push(newUser);
    await writeFile('usersDB.json', JSON.stringify(users), null, 2);
    if (existingSessionIndex === -1) {
      sessions.push({ id: sessionID, userID: sub });
    } else {
      sessions[existingSessionIndex].id = sessionID;
    }
    await writeFile('sessionsDB.json', JSON.stringify(sessions), null, 2);
    res.redirect(`http://localhost:5500/callback.html?sid=${sessionID}`);
    return res.end();
  } else {
    res.redirect(`http://localhost:5500/callback.html?error=true`);
  }
}); */

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
