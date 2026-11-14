// Single source of truth for the account role hierarchy (audit finding M2).
//
// Rule: an actor may only act on accounts that rank STRICTLY below them.
// Equal ranks can never modify, delete, log out or re-role each other, so
// one Admin cannot demote or delete another Admin, and one Owner cannot
// remove another Owner.
export const ROLE_RANKS = Object.freeze({
  User: 0,
  Manager: 1,
  Admin: 2,
  Owner: 3,
});

export const isValidRole = (role) =>
  typeof role === 'string' && Object.hasOwn(ROLE_RANKS, role);

const rankOf = (role) => (isValidRole(role) ? ROLE_RANKS[role] : -1);

/** True only when `actorRole` strictly outranks `targetRole`. */
export function outranks(actorRole, targetRole) {
  if (!isValidRole(actorRole) || !isValidRole(targetRole)) return false;
  return rankOf(actorRole) > rankOf(targetRole);
}

/**
 * Roles an actor may hand out: strictly below their own rank, so nobody can
 * create a peer who would then be out of their reach. The one exception is
 * the Owner, who may still appoint another Owner (an existing capability).
 * The target must additionally be outranked by the actor (see `outranks`).
 */
export function canAssignRole(actorRole, newRole) {
  if (!isValidRole(actorRole) || !isValidRole(newRole)) return false;
  if (actorRole === 'Owner') return true;
  return rankOf(newRole) < rankOf(actorRole);
}
