import { OAuth2Client } from 'google-auth-library';
const client_id = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client({
  client_id,
});

export const verifyIdToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: client_id,
  });
  const userData = ticket.getPayload();
  return userData;
};
