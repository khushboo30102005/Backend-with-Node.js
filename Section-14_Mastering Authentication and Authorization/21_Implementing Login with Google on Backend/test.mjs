import {OAuth2Client} from 'google-auth-library'

const client_id =
  'your Client_id';


const token = ''


const client = new OAuth2Client()
const loginTicket =await client.verifyIdToken({
  idToken: tokan,
  audience: client_id
})
console.log(loginTicket.getPayload())
console.log(loginTicket.getEnvelope())
console.log(loginTicket.getUserId())
console.log(loginTicket.getAttributes())