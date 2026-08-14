import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from './Register';
import DeleteUserModal from './components/DeleteUserModal';

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

// Shared cell classes: desktop table row, collapsing into a labeled
// "card row" below 640px via the `max-[640px]:` variants.
const cellBase =
  'px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100 ' +
  'max-[640px]:flex max-[640px]:items-center max-[640px]:justify-between ' +
  'max-[640px]:border-b-0 max-[640px]:px-1 max-[640px]:py-2 ' +
  'max-[640px]:before:content-[attr(data-label)] max-[640px]:before:font-semibold ' +
  'max-[640px]:before:text-[11px] max-[640px]:before:uppercase max-[640px]:before:tracking-wide ' +
  'max-[640px]:before:text-gray-400 max-[640px]:before:mr-3 max-[640px]:before:flex-shrink-0';

const buttonBase =
  'px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 ' +
  'cursor-pointer transition-colors duration-150 hover:enabled:bg-gray-100 hover:enabled:border-gray-400 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const dangerButton =
  'px-3 py-1.5 text-xs font-semibold rounded-md border border-red-300 bg-red-50 text-red-600 ' +
  'cursor-pointer transition-colors duration-150 hover:enabled:bg-red-100 hover:enabled:border-red-400 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Guest User');
  const [userEmail, setUserEmail] = useState('guest@example.com');
  const [userPicture, setUserPicture] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState([]);
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
      setUserPicture(data.picture);
      setLoggedIn(true);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      else console.error('Error fetching user info:', err);
    }
  }

  async function loadDeletedUsers() {
    try {
      const data = await fetchDeletedUsers();
      console.log(data)
      setDeletedUsers(data);
    } catch (err) {
      console.error('Error fetching deleted users:', err);
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
      loadDeletedUsers()
    }
  }, [showDeleted]);

  return (
    <div className="max-w-[1100px] mx-auto my-10 px-4 md:px-6 font-sans text-text">
      <h1 className="text-[28px] font-bold tracking-tight mb-1.5 inline-block bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent">
        All Users
      </h1>
      <h2 className="text-sm font-medium text-gray-400 mb-7">
        {userName}: {userRole}
      </h2>

      {userRole === 'Owner' && (
        <button
          className="mb-4 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 border border-border cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => setShowDeleted((prev) => !prev)}
        >
          {showDeleted ? 'Back to Active Users' : 'Show Deleted Users'}
        </button>
      )}

      <div className="w-full overflow-x-auto">
        {showDeleted ? (
          <table className="w-full border-separate border-spacing-0 bg-surface rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 max-[640px]:block max-[640px]:bg-transparent max-[640px]:shadow-none max-[640px]:border-0">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 max-[640px]:hidden">
              <tr>
                <th className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 px-5 py-4 border-b border-gray-100">
                  Name
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 px-5 py-4 border-b border-gray-100">
                  Email
                </th>
                <th className="border-b border-gray-100"></th>
              </tr>
            </thead>
            <tbody className="max-[640px]:block">
              {deletedUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors max-[640px]:block max-[640px]:bg-white max-[640px]:border max-[640px]:border-gray-100 max-[640px]:rounded-xl max-[640px]:shadow-sm max-[640px]:mb-3 max-[640px]:p-3"
                >
                  <td className="flex items-center gap-2.5 font-semibold text-text px-3 py-2.5 border-b border-gray-100 max-[640px]:border-b-0">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <span>{user.name}</span>
                  </td>
                  <td className={cellBase} data-label="Email">
                    {user.email}
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
          <table className="w-full border-separate border-spacing-0 bg-surface rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-gray-100 max-[640px]:block max-[640px]:bg-transparent max-[640px]:shadow-none max-[640px]:border-0">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 max-[640px]:hidden">
              <tr>
                <th className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 px-5 py-4 border-b border-gray-100">
                  Name
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 px-5 py-4 border-b border-gray-100">
                  Email
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-400 px-5 py-4 border-b border-gray-100">
                  Status
                </th>
                <th className="border-b border-gray-100"></th>
                {(userRole === 'Admin' || userRole === 'Owner') && (
                  <th className="border-b border-gray-100"></th>
                )}
                {userRole !== 'User' && (
                  <th className="border-b border-gray-100"></th>
                )}
                {userRole !== 'User' && (
                  <th className="border-b border-gray-100"></th>
                )}
              </tr>
            </thead>
            <tbody className="max-[640px]:block">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors max-[640px]:block max-[640px]:bg-white max-[640px]:border max-[640px]:border-gray-100 max-[640px]:rounded-xl max-[640px]:shadow-sm max-[640px]:mb-3 max-[640px]:p-3"
                >
                  <td className="flex items-center gap-2.5 font-semibold text-text px-3 py-2.5 border-b border-gray-100 max-[640px]:border-b-0">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <span>{user.name}</span>
                  </td>
                  <td className={cellBase} data-label="Email">
                    {user.email}
                  </td>
                  <td className={cellBase} data-label="Status">
                    {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
                  </td>
                  <td className={cellBase} data-label="Logout">
                    <button
                      className={buttonBase}
                      onClick={() => logoutUser(user)}
                      disabled={
                        !user.isLoggedIn ||
                        (userRole === 'Manager' &&
                          (user.role === 'Admin' || user.role === 'Owner')) ||
                        (userRole === 'Admin' && user.role === 'Owner')
                      }
                    >
                      Logout
                    </button>
                  </td>
                  {(userRole === 'Admin' || userRole === 'Owner') && (
                    <td className={cellBase} data-label="Delete">
                      <button
                        className={dangerButton}
                        onClick={() => setDeleteModalUser(user)}
                        disabled={
                          userEmail === user.email ||
                          ROLE_RANKS[userRole] < ROLE_RANKS[user.role]
                        }
                      >
                        Delete
                      </button>
                    </td>
                  )}
                  {(userRole === 'Admin' || userRole === 'Owner') && (
                    <td className={cellBase} data-label="Files">
                      <button
                        className={buttonBase}
                        onClick={() =>
                          navigate(`/admin/users/${user._id}/directory`)
                        }
                      >
                        View Files
                      </button>
                    </td>
                  )}
                  {userRole !== 'User' && (
                    <td className={cellBase} data-label="Role">
                      <div className="flex items-center gap-2 max-[640px]:flex-wrap max-[640px]:w-full">
                        <select
                          className="px-2.5 py-1.5 rounded-md border border-gray-300 text-[13px] bg-white flex-1 min-w-0"
                          value={roleEdits[user._id] ?? user.role}
                          onChange={(e) =>
                            handleRoleSelect(user._id, e.target.value)
                          }
                          disabled={
                            userEmail === user.email ||
                            ROLE_RANKS[userRole] < ROLE_RANKS[user.role]
                          }
                        >
                          <option value="User">User</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                          <option value="Owner">Owner</option>
                        </select>
                        <button
                          className={buttonBase}
                          onClick={() => saveRole(user)}
                          disabled={
                            userEmail === user.email ||
                            ROLE_RANKS[userRole] < ROLE_RANKS[user.role] ||
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
              ))}
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
  );
}
