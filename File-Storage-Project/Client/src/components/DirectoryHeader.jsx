import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFolderPlus,
  FaUpload,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserShield,
  FaUserTie,
} from 'react-icons/fa';
import { BASE_URL } from '../Register';
import { fetchUser, logoutAllSessions, logoutUser } from '../apis/userApi';

function DirectoryHeader({
  directoryName,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
  readOnly = false,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Guest User');
  const [userEmail, setUserEmail] = useState('guest@example.com');
  const [userPicture, setUserPicture] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser();
        setUserName(data.name);
        setUserEmail(data.email);
        setUserRole(data.role);
        setLoggedIn(true);
      } catch (err) {
        if (err.response?.status === 401) {
          setUserName('Guest User');
          setUserEmail('guest@example.com');
          setUserRole(null);
          setUserPicture(null);
          setLoggedIn(false);
        } else {
          console.error('Error fetching user info:', err);
        }
      }
    }
    loadUser();
  }, []);

  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setLoggedIn(false);
      setUserName('Guest User');
      setUserEmail('guest@example.com');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllSessions();
      setLoggedIn(false);
      setUserName('Guest User');
      setUserEmail('guest@example.com');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleAdminDashboard = () => {
    navigate('/users');
  };

  useEffect(() => {
    function handleDocumentClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  return (
    <header className="flex flex-wrap justify-between items-center border-b border-border py-4 sticky top-0 z-10 bg-surface">
      <h1 className="m-0 mr-5 text-[1.6rem] font-bold tracking-tight text-text">
        {directoryName}
      </h1>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className="bg-transparent border-none cursor-pointer text-xl text-primary flex items-center justify-center rounded-md p-1.5 transition-colors duration-150 hover:enabled:bg-indigo-50 hover:enabled:text-primary-hover disabled:opacity-40"
          title="Create Folder"
          onClick={onCreateFolderClick}
          disabled={disabled || readOnly}
        >
          <FaFolderPlus />
        </button>
        <button
          className="bg-transparent border-none cursor-pointer text-xl text-primary flex items-center justify-center rounded-md p-1.5 transition-colors duration-150 hover:enabled:bg-indigo-50 hover:enabled:text-primary-hover disabled:opacity-40"
          title="Upload Files"
          onClick={onUploadFilesClick}
          disabled={disabled || readOnly}
        >
          <FaUpload />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />

        {/* User Icon & Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="bg-transparent border-none cursor-pointer text-xl text-primary flex items-center justify-center rounded-md p-1.5 transition-colors duration-150 hover:bg-indigo-50 hover:text-primary-hover"
            title="User Menu"
            onClick={handleUserIconClick}
          >
            {userPicture ? (
              <img
                className="w-7 h-7 rounded-full object-cover"
                src={userPicture}
                alt="User"
              />
            ) : (
              <FaUser />
            )}
          </button>

          {showUserMenu && (
            <div className="absolute top-8 right-0 bg-surface border border-border rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] z-[999] min-w-[170px] overflow-hidden">
              {loggedIn ? (
                <>
                  {/* Display name & email if logged in */}
                  <div className="flex flex-col py-3 px-4 cursor-auto">
                    <span className="font-bold text-text">{userName}</span>
                    <span className="text-[0.82rem] text-text-muted">
                      {userEmail}
                    </span>
                  </div>
                  {userRole === 'Owner' && (
                    <button
                      onClick={handleAdminDashboard}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <FaUserShield size={16} className="text-primary" />
                      Owner Dashboard
                    </button>
                  )}
                  {userRole === 'Admin' && (
                    <button
                      onClick={handleAdminDashboard}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <FaUserShield size={16} className="text-primary" />
                      Admin Dashboard
                    </button>
                  )}
                  {userRole === 'Manager' && (
                    <button
                      onClick={handleAdminDashboard}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <FaUserTie size={16} className="text-primary" />
                      Manager Dashboard
                    </button>
                  )}
                  <div className="border-t border-border" />
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-gray-700 text-[0.9rem] whitespace-nowrap hover:bg-gray-100 transition-colors"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="text-primary" />
                    <span>Logout</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-gray-700 text-[0.9rem] whitespace-nowrap hover:bg-gray-100 transition-colors"
                    onClick={handleLogoutAll}
                  >
                    <FaSignOutAlt className="text-primary" />
                    <span>Logout All</span>
                  </div>
                </>
              ) : (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 cursor-pointer text-gray-700 text-[0.9rem] whitespace-nowrap hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    navigate('/login');
                    setShowUserMenu(false);
                  }}
                >
                  <FaSignInAlt className="text-primary" />
                  <span>Login</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DirectoryHeader;
