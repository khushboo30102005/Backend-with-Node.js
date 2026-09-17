import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaFolderOpen, FaPlus, FaUpload } from 'react-icons/fa';
import DirectoryHeader from './components/DirectoryHeader';
import CreateDirectoryModal from './components/CreateDirectoryModal';
import RenameModal from './components/RenameModal';
import DirectoryList from './components/DirectoryList';
import DetailsPopup from './components/DetailsPopup';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import BreadcrumbBar from './components/BreadcrumbBar';
import { BASE_URL } from './Register';
import { useAutoDismissError } from './hooks/useAutoDismissError';

import {
  getDirectoryItems as fetchDirectoryItems,
  createDirectory as createDirectoryApi,
  deleteDirectory as deleteDirectoryApi,
  renameDirectory as renameDirectoryApi,
} from './apis/directoryApi';
import {
  deleteFile as deleteFileApi,
  renameFile as renameFileApi,
  uploadFileWithProgress,
  getFileUrl,
} from './apis/fileApi';
import { fetchUser, fetchAllUsers } from './apis/userApi';

function DirectoryView({ adminMode = false }) {
  const { dirId, userId } = useParams();
  const navigate = useNavigate();

  const apiBase = adminMode ? `/admin/users/${userId}` : '';
  const [viewerRole, setViewerRole] = useState(null);
  const [targetUserLabel, setTargetUserLabel] = useState('');
  const readOnly = adminMode && viewerRole === 'Admin';

  const [maxStorageInBytes, setMaxStorageInBytes] = useState(0);
  const [usedStorageInBytes, setUsedStorageInBytes] = useState(0);
  const availableStorageBytes = maxStorageInBytes - usedStorageInBytes;

  const [storageRefreshKey, setStorageRefreshKey] = useState(0);

  useEffect(() => {
    async function loadStorageInfo() {
      try {
        const data = await fetchUser();
        setMaxStorageInBytes(data.maxStorageInBytes);
        setUsedStorageInBytes(data.usedStorageInBytes);
      } catch (err) {
        console.error('Error fetching storage info:', err);
      }
    }
    loadStorageInfo();
  }, [storageRefreshKey]);

  useEffect(() => {
    if (!adminMode) return;
    async function fetchViewerRole() {
      try {
        const data = await fetchUser();
        setViewerRole(data.role);
      } catch (err) {
        console.error('Error fetching viewer role:', err);
      }
    }
    fetchViewerRole();
  }, [adminMode]);

  useEffect(() => {
    if (!adminMode) return;
    async function fetchTargetUserInfo() {
      try {
        const users = await fetchAllUsers();
        const match = users.find((u) => u._id === userId);
        if (match) setTargetUserLabel(`${match.name} (${match.email})`);
      } catch (err) {
        console.error('Error fetching target user:', err);
      }
    }
    fetchTargetUserInfo();
  }, [adminMode, userId]);

  const [directoryName, setDirectoryName] = useState('My Drive');
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);

  // Auto-dismissing error states (section 12)
  const [errorMessage, setErrorMessage] = useAutoDismissError();
  const [modalError, setModalError] = useAutoDismissError();

  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState('New Folder');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadControllerMap, setUploadControllerMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Search UI (client-side filter only — no backend search endpoint exists)
  const [searchQuery, setSearchQuery] = useState('');

  async function getDirectoryItems() {
    setErrorMessage('');
    try {
      const data = await fetchDirectoryItems(dirId, apiBase);
      setDirectoryName(dirId ? data.name : 'My Drive');
      setBreadcrumb(data.breadcrumb || []);
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setErrorMessage(err.response?.data?.error || 'Request failed');
    }
  }

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
    setSearchQuery('');
  }, [dirId]);

  function closeContextMenu() {
    setActiveContextMenu(null);
  }

  function openDetailsPopup(item) {
    setDetailsItem(item);
  }

  function openDeleteConfirm(item) {
    setDeleteConfirmItem(item);
  }

  function confirmDelete(item) {
    if (item.isDirectory) {
      handleDeleteDirectory(item.id);
    } else {
      handleDeleteFile(item.id);
    }
    setDeleteConfirmItem(null);
  }

  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'image';
      case 'mp4':
      case 'mov':
      case 'avi':
        return 'video';
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return 'archive';
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
      case 'java':
        return 'code';
      default:
        return 'alt';
    }
  }

  function handleRowClick(type, id) {
    if (type === 'directory') {
      navigate(
        adminMode
          ? `/admin/users/${userId}/directory/${id}`
          : `/directory/${id}`,
      );
    } else {
      window.location.href = `${BASE_URL}${getFileUrl(id, apiBase)}`;
    }
  }

  function handleBreadcrumbClick(id) {
    const isRoot = breadcrumb.length > 0 && id === breadcrumb[0].id;
    navigate(
      adminMode
        ? `/admin/users/${userId}/directory${isRoot ? '' : `/${id}`}`
        : isRoot
          ? '/'
          : `/directory/${id}`,
    );
  }

  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const oversized = selectedFiles.filter(
      (file) => file.size > availableStorageBytes,
    );
    if (oversized.length > 0) {
      setErrorMessage(
        `${oversized.map((f) => f.name).join(', ')} exceed${oversized.length === 1 ? 's' : ''} your available storage.`,
      );
    }

    const validFiles = selectedFiles.filter(
      (file) => file.size <= availableStorageBytes,
    );
    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const newItems = validFiles.map((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return {
        file,
        name: file.name,
        size: file.size,
        id: tempId,
        isUploading: false,
      };
    });

    setFilesList((prev) => [...newItems, ...prev]);

    newItems.forEach((item) => {
      setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
    e.target.value = '';

    if (!isUploading) {
      setIsUploading(true);
      processUploadQueue([...uploadQueue, ...newItems.reverse()]);
    }
  }

  function processUploadQueue(queue) {
    if (queue.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => {
        getDirectoryItems();
      }, 1000);
      setStorageRefreshKey((prev) => prev + 1);
      return;
    }

    const [currentItem, ...restQueue] = queue;

    setFilesList((prev) =>
      prev.map((f) =>
        f.id === currentItem.id ? { ...f, isUploading: true } : f,
      ),
    );

    const controller = new AbortController();
    setUploadControllerMap((prev) => ({
      ...prev,
      [currentItem.id]: controller,
    }));

    uploadFileWithProgress(
      dirId,
      currentItem.file,
      currentItem.name,
      currentItem.size,
      (progressEvent) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setProgressMap((prev) => ({ ...prev, [currentItem.id]: progress }));
        }
      },
      apiBase,
      controller.signal,
    )
      .then(() => {
        processUploadQueue(restQueue);
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          console.error('Upload failed:', err);
          setErrorMessage(
            err.response?.data?.error ||
              `Failed to upload ${currentItem.name}.`,
          );
        }
        processUploadQueue(restQueue);
      });
  }

  function handleCancelUpload(tempId) {
    const controller = uploadControllerMap[tempId];
    if (controller) {
      controller.abort();
    }

    setUploadQueue((prev) => prev.filter((item) => item.id !== tempId));
    setFilesList((prev) => prev.filter((f) => f.id !== tempId));

    setProgressMap((prev) => {
      const { [tempId]: _, ...rest } = prev;
      return rest;
    });

    setUploadControllerMap((prev) => {
      const copy = { ...prev };
      delete copy[tempId];
      return copy;
    });
  }

  async function handleDeleteFile(id) {
    setErrorMessage('');
    try {
      await deleteFileApi(id, apiBase);
      getDirectoryItems();
      setStorageRefreshKey((prev) => prev + 1);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete file.');
    }
  }

  async function handleDeleteDirectory(id) {
    setErrorMessage('');
    try {
      await deleteDirectoryApi(id, apiBase);
      getDirectoryItems();
      setStorageRefreshKey((prev) => prev + 1);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'Failed to delete directory.',
      );
    }
  }

  async function handleCreateDirectory(e) {
    e.preventDefault();
    setModalError('');
    try {
      await createDirectoryApi(dirId, newDirname, apiBase);
      setNewDirname('New Folder');
      setShowCreateDirModal(false);
      getDirectoryItems();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to create directory.');
    }
  }

  function openRenameModal(type, id, currentName) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    setModalError('');
    try {
      if (renameType === 'file') {
        await renameFileApi(renameId, renameValue, apiBase);
      } else {
        await renameDirectoryApi(renameId, renameValue, apiBase);
      }
      setShowRenameModal(false);
      setRenameValue('');
      setRenameType(null);
      setRenameId(null);
      getDirectoryItems();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to rename.');
    }
  }

  function handleContextMenu(e, id) {
    e.stopPropagation();
    e.preventDefault();
    const clickX = e.clientX;
    const clickY = e.clientY;

    if (activeContextMenu === id) {
      setActiveContextMenu(null);
    } else {
      setActiveContextMenu(id);
      setContextMenuPos({ x: clickX - 110, y: clickY });
    }
  }

  const combinedItems = [
    ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
    ...filesList.map((f) => ({ ...f, isDirectory: false })),
  ];
  // console.log({ dirs: directoriesList.length, files: filesList.length });

  const query = searchQuery.trim().toLowerCase();
  const visibleItems = query
    ? combinedItems.filter((item) => item.name.toLowerCase().includes(query))
    : combinedItems;

  const isDirNotFoundError =
    errorMessage === 'Directory not found or you do not have access to it!';

  return (
    <div className="max-w-[1000px] mx-auto px-4 font-sans text-text">
      <BreadcrumbBar
        breadcrumb={breadcrumb}
        onBreadcrumbClick={handleBreadcrumbClick}
      />
      {adminMode && (
        <div className="bg-indigo-50 text-primary-hover border border-indigo-200 rounded-lg px-4 py-2.5 text-sm font-medium mt-4">
          Viewing {targetUserLabel || "another user's"} files —{' '}
          {readOnly ? 'read-only' : 'Owner mode'}
        </div>
      )}
      {errorMessage && !isDirNotFoundError && (
        <div className="bg-red-50 text-danger border border-red-200 rounded-lg px-4 py-2.5 text-sm mt-4">
          {errorMessage}
        </div>
      )}
      <DirectoryHeader
        directoryName={directoryName}
        onCreateFolderClick={() => setShowCreateDirModal(true)}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={isDirNotFoundError}
        readOnly={readOnly}
        storageRefreshKey={storageRefreshKey}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {showCreateDirModal && (
        <CreateDirectoryModal
          newDirname={newDirname}
          setNewDirname={setNewDirname}
          onClose={() => {
            setShowCreateDirModal(false);
            setModalError('');
          }}
          onCreateDirectory={handleCreateDirectory}
          error={modalError}
        />
      )}
      {showRenameModal && (
        <RenameModal
          renameType={renameType}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onClose={() => {
            setShowRenameModal(false);
            setModalError('');
          }}
          onRenameSubmit={handleRenameSubmit}
          error={modalError}
        />
      )}
      {detailsItem && (
        <DetailsPopup
          item={detailsItem}
          breadcrumb={breadcrumb}
          apiBase={apiBase}
          onClose={() => setDetailsItem(null)}
        />
      )}
      {deleteConfirmItem && (
        <ConfirmDeleteModal
          item={deleteConfirmItem}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmItem(null)}
        />
      )}
      {isDirNotFoundError ? (
        <p className="text-center italic mt-10 text-text-muted">
          Directory not found or you do not have access to it!
        </p>
      ) : combinedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <FaFolderOpen size={22} className="text-primary" />
          </div>
          <p className="font-semibold text-text mb-1">Nothing here yet</p>
          <p className="text-sm text-text-muted mb-5 max-w-[280px]">
            Upload a file or create a folder to start organizing your files.
          </p>
          {!readOnly && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCreateDirModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-primary text-white cursor-pointer hover:bg-primary-hover transition-colors"
              >
                <FaPlus size={11} />
                New folder
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-white border border-border text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FaUpload size={11} />
                Upload
              </button>
            </div>
          )}
        </div>
      ) : query && visibleItems.length === 0 ? (
        <p className="text-center italic mt-10 text-text-muted">
          No files or folders match "{searchQuery}".
        </p>
      ) : (
        <DirectoryList
          items={visibleItems}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          contextMenuPos={contextMenuPos}
          handleContextMenu={handleContextMenu}
          closeContextMenu={closeContextMenu}
          getFileIcon={getFileIcon}
          isUploading={isUploading}
          progressMap={progressMap}
          handleCancelUpload={handleCancelUpload}
          openRenameModal={openRenameModal}
          openDeleteConfirm={openDeleteConfirm}
          openDetailsPopup={openDetailsPopup}
          apiBase={apiBase}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

export default DirectoryView;
