import {OAuth2Client} from 'google-auth-library'
const client = new OAuth2Client()

const client_id =
  '';
const client_secret ='';
const redirect_uri = 'http://localhost:4000/auth/google/callback';

export async function fetchUserFromGoogle(code) {
  const payLoad = `code=${code}&client_id=${client_id}&client_secret=${client_secret}&redirect_uri=${redirect_uri}&grant_type=authorization_code`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payLoad,
  });
  const data = await response.json();
  if (data.error) {
    console.log('Error Occurred');
    console.log(data);
    return;
  }
  const loginTicket =await client.verifyIdToken({
  idToken: data.id_token,
  audience: client_id
})
  const userData = loginTicket.getPayload();
  return userData;
}