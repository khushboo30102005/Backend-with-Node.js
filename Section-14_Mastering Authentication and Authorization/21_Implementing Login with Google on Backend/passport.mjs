import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
const client_id = 'YourClientID';
const client_secret = 'Your ClientSecret';
const redirectUri = 'http://localhost:4000/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: redirectUri,
    },
    function (accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    },
  ),
);
