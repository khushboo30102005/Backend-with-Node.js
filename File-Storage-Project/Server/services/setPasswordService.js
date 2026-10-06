import User from '../models/userModel.js';

export async function setInitialPassword(userId, newPassword) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    return { status: 401, error: 'User not found or account is unavailable.' };
  }
  if (user.password) {
    return { status: 409, error: 'A password is already set for this account.' };
  }
  user.password = newPassword;
  await user.save(); // pre('save') hashes it
  return { status: 200, message: 'Password set successfully.' };
}