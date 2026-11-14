import File from '../models/fileModel.js';
import Share from '../models/shareModel.js';
import User from '../models/userModel.js';

// Audit M7: a soft-deleted account keeps its files and Share rows (so an
// Owner can still recover it), but nobody may reach those files through a
// share while the owner is deleted. Every share-based path checks this; the
// rows themselves are left untouched, so recovering the account restores the
// shares exactly as they were and permanent deletion still removes them.
export async function activeOwnerIds(ownerIds) {
  const unique = [...new Set(ownerIds.filter(Boolean).map(String))];
  if (unique.length === 0) return new Set();
  const owners = await User.find({ _id: { $in: unique }, isDeleted: false })
    .select('_id')
    .lean();
  return new Set(owners.map((u) => String(u._id)));
}

// Keeps only shares whose owner account is active. `ownerOf` reads the
// owner id from a share (raw id or populated document).
export async function withActiveOwners(shares, ownerOf = (s) => s.ownerId) {
  const idOf = (s) => {
    const o = ownerOf(s);
    return o && o._id ? o._id : o;
  };
  const active = await activeOwnerIds(shares.map(idOf));
  return shares.filter((s) => active.has(String(idOf(s))));
}

/**
 * Resolves what access (if any) a given user has to a given file.
 *
 * Returns:
 *   { file, role: 'owner' | 'editor' | 'viewer' }   — access granted
 *   null                                             — no access, or file doesn't exist
 *
 * Callers must treat `null` as a 404 (file doesn't exist) OR a 403
 * (file exists but this user has no access) — see note below on why
 * those two cases are deliberately NOT distinguished by this function.
 */
export async function getFileAccess(fileId, requesterId) {
  const file = await File.findById(fileId).lean();
  if (!file || file.isTrashed) return null;

  if (file.userId.toString() === requesterId.toString()) {
    return { file, role: 'owner' };
  }

  const share = await Share.findOne({
    resourceId: fileId,
    sharedWithUserId: requesterId,
  })
    .select('permission')
    .lean();

  if (!share) return null;

  // The file's owner (not the share's ownerId field) is what counts.
  const active = await activeOwnerIds([file.userId]);
  if (!active.has(String(file.userId))) return null;

  return { file, role: share.permission }; // 'viewer' | 'editor'
}

// Small, explicit permission table — the single source of truth for what
// each role can do. Controllers ask this function a yes/no question
// instead of re-deriving the rules themselves.
const CAN = {
  view: ['owner', 'editor', 'viewer'],
  rename: ['owner', 'editor'],
  move: ['owner'],
  delete: ['owner'],
  share: ['owner'],
};

export function canPerform(role, action) {
  return CAN[action]?.includes(role) ?? false;
}
