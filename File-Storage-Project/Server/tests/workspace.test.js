// Run with: npm test   (Node's built-in test runner, no extra dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPerformWs,
  isPending,
  roleOf,
  stateOf,
  EXPIRING_SOON_MS,
  MAX_LIFETIME_MS,
} from '../utils/workspaceAccess.js';
import {
  addMemberSchema,
  createFolderSchema,
  createWorkspaceSchema,
  moveFileSchema,
  renameWorkspaceFileSchema,
  updateWorkspaceSchema,
} from '../validator/workspaceSchema.js';

const OWNER = 'a'.repeat(24);
const EDITOR = 'b'.repeat(24);
const VIEWER = 'c'.repeat(24);
const INVITED = 'd'.repeat(24);
const STRANGER = 'e'.repeat(24);

const ws = (over = {}) => ({
  ownerId: OWNER,
  status: 'active',
  expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
  members: [
    { userId: EDITOR, role: 'editor', status: 'active' },
    { userId: VIEWER, role: 'viewer' }, // legacy entry without a status = active
    { userId: INVITED, role: 'editor', status: 'pending' },
  ],
  ...over,
});
const inDays = (d) => new Date(Date.now() + d * 24 * 3600 * 1000).toISOString();

test('roleOf resolves owner, members and rejects everyone else', () => {
  assert.equal(roleOf(ws(), OWNER), 'owner');
  assert.equal(roleOf(ws(), EDITOR), 'editor');
  assert.equal(roleOf(ws(), VIEWER), 'viewer');
  assert.equal(roleOf(ws(), STRANGER), null);
});

test('a pending invitation grants no access', () => {
  assert.equal(isPending({ status: 'pending' }), true);
  assert.equal(isPending({ status: 'active' }), false);
  assert.equal(isPending({}), false);
  assert.equal(roleOf(ws(), INVITED), null);
});

test('permission table: viewers read only, editors write, only owner manages', () => {
  for (const a of ['view']) assert.ok(canPerformWs('viewer', a));
  for (const a of ['upload', 'rename', 'deleteOwn', 'deleteAny', 'manage']) {
    assert.equal(canPerformWs('viewer', a), false, `viewer must not ${a}`);
  }
  assert.ok(canPerformWs('editor', 'upload'));
  assert.ok(canPerformWs('editor', 'deleteOwn'));
  assert.equal(canPerformWs('editor', 'deleteAny'), false);
  assert.equal(canPerformWs('editor', 'manage'), false);
  assert.ok(canPerformWs('owner', 'manage'));
  assert.equal(canPerformWs(null, 'view'), false);
  assert.equal(canPerformWs('owner', 'unknown-action'), false);
});

test('stateOf derives active / expiring / expired / purged', () => {
  assert.equal(stateOf(ws()), 'active');
  assert.equal(stateOf(ws({ expiresAt: new Date(Date.now() + EXPIRING_SOON_MS - 1000) })), 'expiring');
  assert.equal(stateOf(ws({ status: 'expired' })), 'expired');
  assert.equal(stateOf(ws({ status: 'purged' })), 'purged');
});

test('createWorkspaceSchema accepts a valid payload and applies defaults', () => {
  const r = createWorkspaceSchema.safeParse({ name: 'Sprint review', expiresAt: inDays(2) });
  assert.ok(r.success);
  assert.equal(r.data.cleanupPolicy, 'delete');
  assert.deepEqual(r.data.members, []);
});

test('createWorkspaceSchema rejects bad expiry, names and members', () => {
  const bad = (over) =>
    createWorkspaceSchema.safeParse({ name: 'Sprint review', expiresAt: inDays(2), ...over }).success;
  assert.equal(bad({ expiresAt: 'not a date' }), false);
  assert.equal(bad({ expiresAt: new Date(Date.now() + 1000).toISOString() }), false); // < 5 min
  assert.equal(bad({ expiresAt: new Date(Date.now() - 1000).toISOString() }), false); // past
  assert.equal(bad({ expiresAt: new Date(Date.now() + MAX_LIFETIME_MS + 86400000).toISOString() }), false);
  assert.equal(bad({ name: 'ab' }), false);
  assert.equal(bad({ name: '<script>x</script>' }), false);
  assert.equal(bad({ cleanupPolicy: 'keep-forever' }), false);
  assert.equal(bad({ members: [{ userId: 'nope', role: 'viewer' }] }), false);
  assert.equal(bad({ members: [{ userId: EDITOR, role: 'owner' }] }), false); // no privilege escalation
  assert.equal(bad({ members: [{ userId: EDITOR, role: 'editor' }] }), true);
});

test('updateWorkspaceSchema is strict: no smuggling ownerId / status / size', () => {
  assert.equal(updateWorkspaceSchema.safeParse({}).success, false);
  assert.equal(updateWorkspaceSchema.safeParse({ ownerId: EDITOR }).success, false);
  assert.equal(updateWorkspaceSchema.safeParse({ status: 'active', name: 'Valid name' }).success, false);
  assert.equal(updateWorkspaceSchema.safeParse({ size: 0 }).success, false);
  assert.ok(updateWorkspaceSchema.safeParse({ name: 'Valid name' }).success);
});

test('member, folder and file payload validation', () => {
  assert.ok(addMemberSchema.safeParse({ userId: EDITOR, role: 'viewer' }).success);
  assert.equal(addMemberSchema.safeParse({ userId: EDITOR, role: 'owner' }).success, false);
  assert.ok(createFolderSchema.safeParse({ name: 'Designs', parentId: null }).success);
  assert.equal(createFolderSchema.safeParse({ name: 'a/b' }).success, false);
  assert.equal(createFolderSchema.safeParse({ name: '..\\x' }).success, false);
  assert.equal(createFolderSchema.safeParse({ name: '   ' }).success, false);
  assert.ok(moveFileSchema.safeParse({ folderId: null }).success);
  assert.equal(moveFileSchema.safeParse({ folderId: 'x' }).success, false);
  assert.equal(renameWorkspaceFileSchema.safeParse({ newFilename: '<b>' }).success, false);
  assert.ok(renameWorkspaceFileSchema.safeParse({ newFilename: 'report v2.pdf' }).success);
});
