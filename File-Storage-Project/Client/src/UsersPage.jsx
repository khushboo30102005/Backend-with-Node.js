import { useEffect, useState } from 'react';
import './UsersPage.css';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from './components/DirectoryHeader';
import DeleteUserModal from './components/DeleteUserModal';
const ROLE_RANKS = {
  User: 0,
  Manager: 1,
  Admin: 2,
  Owner: 3,
};
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

  const logoutUser = async (user) => {
    const { _id: id, email, role } = user;
    const logoutConfirmed = confirm(`You are about to logout ${email}`);
    if (!logoutConfirmed) return;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        console.log('Logged out successfully');
        fetchUsers();
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const softDeleteUser = async (user) => {
    const { _id: id } = user;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Soft delete failed');
      }
    } catch (err) {
      console.error('Soft delete error:', err);
    }
  };

  const hardDeleteUser = async (user) => {
    const { _id: id } = user;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/hard`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchUsers();
      } else {
        console.error('Permanent delete failed');
      }
    } catch (err) {
      console.error('Permanent delete error:', err);
    }
  };

  async function fetchUsers() {
    try {
      const response = await fetch('http://localhost:4000/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setUsers(data);
      } else if (response.status === 403) {
        navigate('/');
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function fetchUser() {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Set user info if logged in
        setUserName(data.name);
        setUserEmail(data.email);
        setUserRole(data.role);
        setUserPicture(data.picture);
        setLoggedIn(true);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        // Handle other error statuses if needed
        console.error('Error fetching user info:', response.status);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }

  async function fetchDeletedUsers() {
    try {
      const response = await fetch(`${BASE_URL}/users/deleted`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDeletedUsers(data);
      } else {
        console.error('Error fetching deleted users:', response.status);
      }
    } catch (err) {
      console.error('Error fetching deleted users:', err);
    }
  }

  const recoverUser = async (user) => {
    const { _id: id } = user;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/recover`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (response.ok) {
        fetchDeletedUsers();
      } else {
        console.error('Recover failed');
      }
    } catch (err) {
      console.error('Recover error:', err);
    }
  };

  const handleRoleSelect = (userId, newRole) => {
    setRoleEdits((prev) => ({ ...prev, [userId]: newRole }));
  };

  const saveRole = async (user) => {
    const newRole = roleEdits[user._id];
    if (!newRole || newRole === user.role) return;

    try {
      const response = await fetch(`${BASE_URL}/users/${user._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include',
      });
      if (response.ok) {
        fetchUsers();
        setRoleEdits((prev) => {
          const { [user._id]: _, ...rest } = prev;
          return rest;
        });
      } else {
        const data = await response.json();
        alert(data.error || 'Role change failed');
      }
    } catch (err) {
      console.error('Role change error:', err);
    }
  };
  useEffect(() => {
    fetchUsers();
    fetchUser();
  }, []);

  useEffect(() => {
    if (showDeleted) {
      fetchDeletedUsers();
    }
  }, [showDeleted]);

  return (
    <div  className="users-container table-scroll">
      <h1 className="title">All Users</h1>
      <h2>
        {userName}: {userRole}
      </h2>
      {userRole === 'Owner' && (
        <button
          className="secondary-button"
          onClick={() => setShowDeleted((prev) => !prev)}
          style={{ marginBottom: '16px' }}
        >
          {showDeleted ? 'Back to Active Users' : 'Show Deleted Users'}
        </button>
      )}

      {showDeleted ? (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deletedUsers.map((user) => (
              <tr key={user._id}>
                <td className="user-name-cell">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="user-avatar"
                    />
                  ) : (
                    <span className="user-avatar user-avatar-initial">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span>{user.name}</span>
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Recover">
                  <button
                    className="logout-button"
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
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
              {(userRole === 'Admin' || userRole === 'Owner') && <th></th>}
              {userRole !== 'User' && <th></th>}
              {userRole !== 'User' && <th></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="user-name-cell">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="user-avatar"
                    />
                  ) : (
                    <span className="user-avatar user-avatar-initial">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span>{user.name}</span>
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Status">
                  {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
                </td>
                <td data-label="Logout">
                  <button
                    className="logout-button"
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
                  <td data-label="Delete">
                    <button
                      className="logout-button delete-button"
                      onClick={() => setDeleteModalUser(user)}
                      disabled={userEmail === user.email}
                    >
                      Delete
                    </button>
                  </td>
                )}
                {(userRole === 'Admin' || userRole === 'Owner') && (
                  <td data-label="Files">
                    <button
                      className="logout-button"
                      onClick={() =>
                        navigate(`/admin/users/${user._id}/directory`)
                      }
                    >
                      View Files
                    </button>
                  </td>
                )}
                {userRole !== 'User' && (
                  <td data-label="Role">
                    <div className="role-change-cell">
                      <select
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
                        className="logout-button"
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
