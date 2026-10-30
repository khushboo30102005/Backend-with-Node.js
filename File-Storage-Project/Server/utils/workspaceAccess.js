import Workspace from '../models/workspaceModel.js';

export const WORKSPACE_MAX_BYTES =
  Number(process.env.WORKSPACE_MAX_BYTES) || 500 * 1024 * 1024;
export const WORKSPACE_MAX_MEMBERS = 50;
export const MIN_LIFETIME_MS = 5 * 60 * 1000;
export const MAX_LIFETIME_MS =
  (Number(process.env.WORKSPACE_MAX_DAYS) || 90) * 24 * 60 * 60 * 1000;
export const ARCHIVE_RETENTION_MS =
  (Number(process.env.WORKSPACE_ARCHIVE_DAYS) || 30) * 24 * 60 * 60 * 1000;
export const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

// Role table — the single source of truth for what each workspace role can do.
const CAN = {
  view: ['owner', 'editor', 'viewer'],
  upload: ['owner', 'editor'],
  rename: ['owner', 'editor'],
  deleteOwn: ['owner', 'editor'],
  deleteAny: ['owner'],
  manage: ['owner'], // settings, members, ownership, delete workspace
};

export const canPerformWs = (role, action) => CAN[action]?.includes(role) ?? false;

export const roleOf = (workspace, userId) => {
  const id = String(userId);
  if (String(workspace.ownerId) === id) return 'owner';
  return workspace.members.find((m) => String(m.userId) === id)?.role ?? null;
};

/**
 * Moves a workspace whose time is up from `active` to `expired`. Atomic and
 * idempotent: only one caller (request or sweeper) wins the transition.
 * Enforced lazily on every access so access is revoked at the exact expiry
 * instant even if the sweeper hasn't run (or the host was asleep).
 */
export async function expireIfDue(workspace) {
  if (workspace.status !== 'active' || workspace.expiresAt > new Date()) {
    return workspace;
  }
  const now = new Date();
  const purgeAfter =
    workspace.cleanupPolicy === 'archive'
      ? new Date(workspace.expiresAt.getTime() + ARCHIVE_RETENTION_MS)
      : workspace.expiresAt;
  const updated = await Workspace.findOneAndUpdate(
    { _id: workspace._id, status: 'active', expiresAt: { $lte: now } },
    { status: 'expired', expiredAt: now, purgeAfter },
    { new: true },
  ).lean();
  return updated ?? (await Workspace.findById(workspace._id).lean());
}

/**
 * Resolves a user's access to a workspace.
 *   { workspace, role, readOnly }                 access granted
 *   { error: { status, code, message, workspace } } denied
 * Non-members get a uniform 404 so workspace ids can't be probed.
 */
export async function getWorkspaceAccess(workspaceId, userId) {
  let workspace = await Workspace.findById(workspaceId).lean();
  const role = workspace && roleOf(workspace, userId);
  if (!workspace || !role) {
    return { error: { status: 404, message: 'Workspace not found!' } };
  }

  workspace = await expireIfDue(workspace);
  if (!workspace) {
    return { error: { status: 404, message: 'Workspace not found!' } };
  }

  if (workspace.status === 'active') {
    return { workspace, role, readOnly: false };
  }

  // Expired: members are locked out. The owner keeps read-only access to an
  // archive until it is purged.
  if (
    workspace.status === 'expired' &&
    workspace.cleanupPolicy === 'archive' &&
    role === 'owner'
  ) {
    return { workspace, role, readOnly: true };
  }

  return {
    error: {
      status: 410,
      code: 'WORKSPACE_EXPIRED',
      message:
        workspace.status === 'purged'
          ? 'This workspace has expired and its data was removed.'
          : 'This workspace has expired and access was revoked.',
      workspace,
    },
  };
}

export const stateOf = (workspace) => {
  if (workspace.status !== 'active') return workspace.status;
  return workspace.expiresAt.getTime() - Date.now() <= EXPIRING_SOON_MS
    ? 'expiring'
    : 'active';
};
