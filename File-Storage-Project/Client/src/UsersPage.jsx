import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import DeleteUserModal from './components/DeleteUserModal';
import AuthBackground from './components/AuthBackground';

import {
  fetchUser,
  fetchAllUsers,
  fetchDeletedUsers,
  logoutUserById,
  deleteUserById,
  hardDeleteUserById,
  recoverUser as recoverUserApi,
  changeUserRole as changeUserRoleApi,
} from './apis/userApi';

const ROLE_RANKS = {
  User: 0,
  Manager: 1,
  Admin: 2,
  Owner: 3,
};

// Everything below uses theme tokens (surface / text / border / primary …)
// instead of fixed gray-* / white utilities. The fixed ones were only remapped
// for dark mode when used as a bare class, so the `max-[640px]:` variants
// (the mobile cards) stayed white with light text. Tokens fix that for good.

// Shared cell classes: desktop table row, collapsing into a labeled
// "card row" below 640px via the `max-[640px]:` variants.
const cellBase =
  'px-3 py-2.5 text-sm text-text border-b border-border ' +
  'max-[640px]:flex max-[640px]:items-center max-[640px]:justify-between ' +
  'max-[640px]:border-b-0 max-[640px]:px-1 max-[640px]:py-2 ' +
  'max-[640px]:before:content-[attr(data-label)] max-[640px]:before:font-semibold ' +
  'max-[640px]:before:text-[11px] max-[640px]:before:uppercase max-[640px]:before:tracking-wide ' +
  'max-[640px]:before:text-text-muted max-[640px]:before:mr-3 max-[640px]:before:flex-shrink-0';

const nameCell =
  'flex items-center gap-2.5 font-semibold text-text px-3 py-2.5 border-b border-border ' +
  'max-[640px]:border-b max-[640px]:border-border max-[640px]:px-1 max-[640px]:pt-0 max-[640px]:pb-3 max-[640px]:mb-1';

const headerCell =
  'text-left text-[11px] font-bold uppercase tracking-wide text-text-muted px-5 py-4 border-b border-border';

const buttonBase =
  'px-3 py-1.5 text-xs font-semibold rounded-md border border-border-strong bg-surface text-text ' +
  'cursor-pointer transition-colors duration-150 hover:enabled:bg-surface-hover hover:enabled:border-primary/50 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const dangerButton =
  'px-3 py-1.5 text-xs font-semibold rounded-md border border-danger/30 bg-danger/10 text-danger ' +
  'cursor-pointer transition-colors duration-150 hover:enabled:bg-danger/20 hover:enabled:border-danger/50 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const tableClass =
  'w-full border-separate border-spacing-0 bg-surface/80 backdrop-blur-md rounded-[14px] overflow-hidden shadow-card border border-border ' +
  'max-[640px]:block max-[640px]:bg-transparent max-[640px]:backdrop-blur-none max-[640px]:shadow-none max-[640px]:border-0';

// Rows: distinct tinted background (zebra on desktop, solid cards on mobile),
// the signed-in user's own row highlighted in the accent colour.
function rowClassFor(isSelf) {
  return (
    'transition-colors max-[640px]:block max-[640px]:border max-[640px]:rounded-xl max-[640px]:shadow-sm max-[640px]:mb-3 max-[640px]:p-3 ' +
    (isSelf
      ? 'bg-primary/[0.08] hover:bg-primary/[0.12] max-[640px]:bg-primary/[0.1] max-[640px]:border-primary/40'
      : 'even:bg-surface-muted/50 hover:bg-primary/[0.05] max-[640px]:even:bg-surface max-[640px]:bg-surface max-[640px]:border-border')
  );
}

function Avatar({ user }) {
  return user.picture ? (
    <img
      src={user.picture}
      alt={user.name}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold flex-shrink-0">
      {user.name?.[0]?.toUpperCase()}
    </span>
  );
}

function StatusPill({ loggedIn }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        loggedIn
          ? 'bg-success/15 text-success'
          : 'bg-surface-muted text-text-muted'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {loggedIn ? 'Logged In' : 'Logged Out'}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState('Guest User');
  const [userEmail, setUserEmail] = useState('guest@example.com');
  const [userRole, setUserRole] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [deletedLoaded, setDeletedLoaded] = useState(false);
  const [roleEdits, setRoleEdits] = useState({});
  const navigate = useNavigate();

  async function loadUsers() {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      if (err.response?.status === 403) navigate('/');
      else if (err.response?.status === 401) navigate('/login');
      else console.error('Error fetching users:', err);
    }
  }
  async function loadUser() {
    try {
      const data = await fetchUser();
      setUserName(data.name);
      setUserEmail(data.email);
      setUserRole(data.role);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else console.error('Error fetching user info:', err);
    }
  }

  async function loadDeletedUsers() {
    try {
      const data = await fetchDeletedUsers();
      setDeletedUsers(data);
    } catch (err) {
      console.error('Error fetching deleted users:', err);
    } finally {
      setDeletedLoaded(true);
    }
  }

  const logoutUser = async (user) => {
    const logoutConfirmed = confirm(`You are about to logout ${user.email}`);
    if (!logoutConfirmed) return;
    try {
      await logoutUserById(user._id);
      loadUsers();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const softDeleteUser = async (user) => {
    try {
      await deleteUserById(user._id);
      loadUsers();
    } catch (err) {
      console.error('Soft delete error:', err);
    }
  };

  const hardDeleteUser = async (user) => {
    try {
      await hardDeleteUserById(user._id);
      loadUsers();
    } catch (err) {
      console.error('Permanent delete error:', err);
    }
  };

  const recoverUser = async (user) => {
    try {
      await recoverUserApi(user._id);
      loadDeletedUsers();
    } catch (err) {
      console.error('Recover error:', err);
    }
  };

  const saveRole = async (user) => {
    const newRole = roleEdits[user._id];
    if (!newRole || newRole === user.role) return;
    try {
      await changeUserRoleApi(user._id, newRole);
      loadUsers();
      setRoleEdits((prev) => {
        const { [user._id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Role change failed');
    }
  };

  const handleRoleSelect = (userId, newRole) => {
    setRoleEdits((prev) => ({ ...prev, [userId]: newRole }));
  };

  useEffect(() => {
    loadUsers();
    loadUser();
  }, []);

  useEffect(() => {
    if (showDeleted) {
      loadDeletedUsers();
    }
  }, [showDeleted]);

  const canDelete = userRole === 'Admin' || userRole === 'Owner';
  const canSeeRole = userRole !== 'User';

  return (
    <AuthBackground>
      <div className="max-w-[1100px] mx-auto my-6 sm:my-10 px-4 md:px-6 font-sans text-text">
        <Link to="/mydrive" className="text-sm text-primary hover:underline">
          ← Back to My Drive
        </Link>

        <h1 className="mt-3 text-[26px] sm:text-[28px] font-bold tracking-tight mb-1.5 block w-fit bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
          All Users
        </h1>
        <h2 className="text-sm font-medium text-text-muted mb-6">
          {userName}: {userRole}
        </h2>

        {userRole === 'Owner' && (
          <button
            className="mb-4 px-4 py-2 text-sm font-semibold rounded-lg bg-surface text-text border border-border cursor-pointer hover:bg-surface-hover transition-colors"
            onClick={() => setShowDeleted((prev) => !prev)}
          >
            {showDeleted ? 'Back to Active Users' : 'Show Deleted Users'}
          </button>
        )}

        <div className="w-full overflow-x-auto">
          {showDeleted && deletedLoaded && deletedUsers.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-12 rounded-[14px] border border-border bg-surface/80 backdrop-blur-md shadow-card">
              <p className="font-semibold text-text mb-1">No deleted users</p>
              <p className="text-sm text-text-muted">
                Users you delete will appear here so you can recover them.
              </p>
            </div>
          ) : showDeleted && !deletedLoaded ? (
            <p className="text-center italic py-10 text-text-muted">Loading...</p>
          ) : showDeleted ? (
            <table className={tableClass}>
              <thead className="bg-surface-muted/70 max-[640px]:hidden">
                <tr>
                  <th className={headerCell}>Name</th>
                  <th className={headerCell}>Email</th>
                  <th className="border-b border-border"></th>
                </tr>
              </thead>
              <tbody className="max-[640px]:block">
                {deletedUsers.map((user) => (
                  <tr key={user._id} className={rowClassFor(false)}>
                    <td className={nameCell}>
                      <Avatar user={user} />
                      <span className="truncate">{user.name}</span>
                    </td>
                    <td className={cellBase} data-label="Email">
                      <span className="truncate">{user.email}</span>
                    </td>
                    <td className={cellBase} data-label="Recover">
                      <button
                        className={buttonBase}
                        onClick={() => recoverUser(user)}
                      >
                        Recover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={tableClass}>
              <thead className="bg-surface-muted/70 max-[640px]:hidden">
                <tr>
                  <th className={headerCell}>Name</th>
                  <th className={headerCell}>Email</th>
                  <th className={headerCell}>Status</th>
                  <th className="border-b border-border"></th>
                  {canDelete && <th className="border-b border-border"></th>}
                  {canSeeRole && <th className={headerCell}>Role</th>}
                </tr>
              </thead>
              <tbody className="max-[640px]:block">
                {users.map((user) => {
                  const isSelf = userEmail === user.email;
                  const locked =
                    isSelf || ROLE_RANKS[userRole] < ROLE_RANKS[user.role];
                  return (
                    <tr key={user._id} className={rowClassFor(isSelf)}>
                      <td className={nameCell}>
                        <Avatar user={user} />
                        <span className="truncate">{user.name}</span>
                        {isSelf && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </td>
                      <td className={cellBase} data-label="Email">
                        <span className="truncate min-w-0">{user.email}</span>
                      </td>
                      <td className={cellBase} data-label="Status">
                        <StatusPill loggedIn={user.isLoggedIn} />
                      </td>
                      <td className={cellBase} data-label="Logout">
                        <button
                          className={buttonBase}
                          onClick={() => logoutUser(user)}
                          disabled={
                            !user.isLoggedIn ||
                            (userRole === 'Manager' &&
                              (user.role === 'Admin' ||
                                user.role === 'Owner')) ||
                            (userRole === 'Admin' && user.role === 'Owner')
                          }
                        >
                          Logout
                        </button>
                      </td>
                      {canDelete && (
                        <td className={cellBase} data-label="Delete">
                          <button
                            className={dangerButton}
                            onClick={() => setDeleteModalUser(user)}
                            disabled={locked}
                          >
                            Delete
                          </button>
                        </td>
                      )}

                      {canSeeRole && (
                        <td className={cellBase} data-label="Role">
                          <div className="flex items-center gap-2 max-[640px]:flex-1 max-[640px]:justify-end">
                            <select
                              className="px-2.5 py-1.5 rounded-md border border-border-strong text-[13px] bg-surface text-text flex-1 min-w-0 max-[640px]:flex-none max-[640px]:w-32"
                              value={roleEdits[user._id] ?? user.role}
                              onChange={(e) =>
                                handleRoleSelect(user._id, e.target.value)
                              }
                              disabled={locked}
                            >
                              {/* Only offer roles the current user may assign
                                  (the server rejects anything higher). */}
                              {Object.keys(ROLE_RANKS)
                                .filter(
                                  (r) =>
                                    ROLE_RANKS[r] <= ROLE_RANKS[userRole] ||
                                    r === user.role,
                                )
                                .map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                            </select>
                            <button
                              className={buttonBase}
                              onClick={() => saveRole(user)}
                              disabled={
                                locked ||
                                !roleEdits[user._id] ||
                                roleEdits[user._id] === user.role
                              }
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {deleteModalUser && (
          <DeleteUserModal
            user={deleteModalUser}
            onClose={() => setDeleteModalUser(null)}
            onSoftDelete={softDeleteUser}
            onHardDelete={hardDeleteUser}
          />
        )}
      </div>
    </AuthBackground>
  );
}