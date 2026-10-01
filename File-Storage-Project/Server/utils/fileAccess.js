import File from '../models/fileModel.js';
import Share from '../models/shareModel.js';

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
