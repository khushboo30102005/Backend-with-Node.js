import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  FaPlus,
  FaUpload,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserShield,
  FaUserTie,
  FaSearch,
} from 'react-icons/fa';
import { fetchUser, logoutAllSessions, logoutUser } from '../apis/userApi';

function DirectoryHeader({
  directoryName,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
  readOnly = false,
  storageRefreshKey = 0,
  searchValue = '',
  onSearchChange,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userPicture, setUserPicture] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchUser();
        setUserRole(data.role);
        setUserPicture(data.picture || null);
        setLoggedIn(true);
      } catch (err) {
        if (err.response?.status === 401) {
          setUserRole(null);
          setUserPicture(null);
          setLoggedIn(false);
        } else {
          console.error('Error fetching user info:', err);
        }
      }
    }
    loadUser();
  }, [storageRefreshKey]);

  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setLoggedIn(false);
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

  const actionButtonClass =
    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold  border border-border text-text cursor-pointer transition-all duration-150 hover:enabled:bg-surface-hover hover:enabled:border-gray-300 hover:enabled:scale-[1.03] active:enabled:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

  const menuRowClass =
    'flex items-center gap-2 px-4 py-2.5 cursor-pointer text-[0.9rem] whitespace-nowrap hover:bg-gray-100 transition-colors';

  return (
    <header className="flex flex-col gap-3 border-b border-border py-4 ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[1.5rem] font-bold tracking-tight text-text truncate max-w-[45vw]">
          {directoryName}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <button
                className={actionButtonClass}
                title="New folder"
                onClick={onCreateFolderClick}
                disabled={disabled}
              >
                <FaPlus size={12} />
                <span>New</span>
              </button>

              <button
                className={actionButtonClass}
                title="Upload files"
                onClick={onUploadFilesClick}
                disabled={disabled}
              >
                <FaUpload size={12} />
                <span className="hidden sm:inline">Upload</span>
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
            </>
          )}

          {/* User Icon & Dropdown Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              className="bg-transparent border-none cursor-pointer flex items-center justify-center rounded-full p-0.5 transition-all duration-150 hover:bg-primary/10 ring-2 ring-transparent hover:ring-primary/20"
              title="User Menu"
              onClick={handleUserIconClick}
            >
              {userPicture ? (
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={userPicture}
                  alt="User"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <FaUser size={14} />
                </span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute top-11 right-0 bg-surface border border-border rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] z-[999] w-[calc(100vw-2rem)] max-w-[220px] overflow-hidden">
                {loggedIn ? (
                  <>
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
                    {userRole !== 'User' && (
                      <div className="border-t border-border" />
                    )}
                    <div className={menuRowClass} onClick={handleLogout}>
                      <FaSignOutAlt className="text-primary" />
                      <span>Logout</span>
                    </div>
                    <div className={menuRowClass} onClick={handleLogoutAll}>
                      <FaSignOutAlt className="text-primary" />
                      <span>Logout all devices</span>
                    </div>
                  </>
                ) : (
                  <div
                    className={menuRowClass}
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
      </div>

      {onSearchChange && (
        <div className="relative w-full sm:max-w-[320px]">
          <FaSearch
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm  text-text transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
          />
        </div>
      )}
    </header>
  );
}

export default DirectoryHeader;