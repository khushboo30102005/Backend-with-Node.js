import { canPerformWs, getWorkspaceAccess } from './workspaceAccess.js';

export const firstZodError = (result) => result.error.issues[0]?.message || 'Invalid input';

// Sends the right error response for a denied access result.
export const deny = (res, access) => {
  const { status, code, message, workspace } = access.error;
  res.status(status).json({
    error: message,
    ...(code && { code }),
    ...(workspace && {
      workspace: {
        _id: workspace._id,
        name: workspace.name,
        expiresAt: workspace.expiresAt,
        cleanupPolicy: workspace.cleanupPolicy,
        status: workspace.status,
      },
    }),
  });
};

// Resolves access and enforces an action in one place. Returns the access
// object, or null after having already responded.
export async function authorize(req, res, action, { write = false } = {}) {
  const access = await getWorkspaceAccess(req.params.id, req.user._id);
  if (access.error) {
    deny(res, access);
    return null;
  }
  if (!canPerformWs(access.role, action)) {
    res.status(403).json({ error: 'You do not have permission to do this.' });
    return null;
  }
  if (write && access.readOnly) {
    res.status(403).json({ error: 'This workspace is archived and read-only.' });
    return null;
  }
  return access;
}
