import { OAuth2Client } from 'google-auth-library';

const client_id = 'YourClientID';
const client_secret = 'Your ClientSecret';
const redirectUri = 'http://localhost:4000/auth/google/callback';
const client = new OAuth2Client({
  client_id,
  client_secret,
  redirectUri,
});
export function generateGoogleAuthURL() {
  return client.generateAuthUrl({
    scope: ['email', 'profile', 'openid'],
    prompt: 'consent',
    // prompt: 'select_account',
    // access_type: 'offline',
    // login_hint: 'k@gmail.com'
  });
}

export async function fetchUserFromGoogle(code) {
  const payLoad = `code=${code}&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirectUri}&grant_type=authorization_code`;
  const { tokens } = await client.getToken(code);
  console.log(tokens);
  const loginTicket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: client_id,
  });
  const userData = loginTicket.getPayload();
  return userData;
}
