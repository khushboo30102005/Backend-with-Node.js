import { OAuth2Client } from 'google-auth-library';

const client_id = 'your_client_id.apps.googleusercontent.com';
const client = new OAuth2Client({});

// login using implicit flow and get the idToken from the frontend, then verify it on the backend using this function
export async function verifyIdToken(idToken) {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience: client_id,
  });
  const userData = loginTicket.getPayload();
  return userData;
}
