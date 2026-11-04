import WorkspaceActivity from '../models/workspaceActivityModel.js';

// Best-effort audit logging: a failed log write must never fail the action.
export function logActivity(workspaceId, actorId, type, extra = {}) {
  return WorkspaceActivity.create({
    workspaceId,
    actorId: actorId ?? null,
    type,
    targetName: String(extra.targetName ?? '').slice(0, 255),
    targetUserId: extra.targetUserId ?? null,
    detail: String(extra.detail ?? '').slice(0, 255),
  }).catch((err) => console.error('[workspace-activity]', err.message));
}
