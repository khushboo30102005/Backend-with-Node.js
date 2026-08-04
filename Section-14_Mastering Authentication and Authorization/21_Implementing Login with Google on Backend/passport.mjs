import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
const client_id = 'your_client_id.apps.googleusercontent.com';
const client_secret = 'your_client_secret';
const redirectUri = 'your_redirect_uri';

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
