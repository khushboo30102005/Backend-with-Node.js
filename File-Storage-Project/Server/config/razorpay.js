import Razorpay from 'razorpay';

// Keys come only from the server environment; they are never sent to the
// browser (only the public key id is, as Razorpay Checkout requires).
let client = null;
let clientKey = '';

export const getKeyId = () => process.env.RAZORPAY_KEY_ID || '';
export const getKeySecret = () => process.env.RAZORPAY_KEY_SECRET || '';
export const isRazorpayConfigured = () => Boolean(getKeyId() && getKeySecret());

export function getRazorpay() {
  if (!isRazorpayConfigured()) return null;
  const sig = `${getKeyId()}:${getKeySecret()}`;
  if (!client || clientKey !== sig) {
    client = new Razorpay({ key_id: getKeyId(), key_secret: getKeySecret() });
    clientKey = sig;
  }
  return client;
}
