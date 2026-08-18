import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DirectoryHeader from './components/DirectoryHeader';
import CreateDirectoryModal from './components/CreateDirectoryModal';
import RenameModal from './components/RenameModal';
import DirectoryList from './components/DirectoryList';
import DetailsPopup from './components/DetailsPopup';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { BASE_URL } from './Register';

function DirectoryView({ adminMode = false }) {
  const { dirId, userId } = useParams();

  const navigate = useNavigate();

  // Admin-mode: compute the API base and whether the viewer is read-only
  const apiBase = adminMode ? `${BASE_URL}/admin/users/${userId}` : BASE_URL;
  const [viewerRole, setViewerRole] = useState(null);
  const [targetUserLabel, setTargetUserLabel] = useState('');
  const readOnly = adminMode && viewerRole === 'Admin';

  // Fetch viewer role (needed to decide read-only, only relevant in adminMode)
  useEffect(() => {
    if (!adminMode) return;
    async function fetchViewerRole() {
      try {
        const response = await fetch(`${BASE_URL}/user`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setViewerRole(data.role);
        }
      } catch (err) {
        console.error('Error fetching viewer role:', err);
      }
    }
    fetchViewerRole();
  }, [adminMode]);

  useEffect(() => {
    if (!adminMode) return;
    async function fetchTargetUser() {
      try {
        const response = await fetch(`${BASE_URL}/users`, {
          credentials: 'include',
        });
        if (response.ok) {
          const users = await response.json();
          const match = users.find((u) => u._id === userId);
          if (match) {
            setTargetUserLabel(`${match.name} (${match.email})`);
          }
        }
      } catch (err) {
        console.error('Error fetching target user:', err);
      }
    }
    fetchTargetUser();
  }, [adminMode, userId]);

  // Displayed directory name
  const [directoryName, setDirectoryName] = useState('My Drive');

  // Lists of items
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);

  // Error state
  const [errorMessage, setErrorMessage] = useState('');

  // Modal states
  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState('New Folder');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null); // "directory" or "file"
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Details popup + delete confirmation
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Uploading states
  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]); // queued items to upload
  const [uploadXhrMap, setUploadXhrMap] = useState({}); // track XHR per item
  const [progressMap, setProgressMap] = useState({}); // track progress per item
  const [isUploading, setIsUploading] = useState(false); // indicates if an upload is in progress

  // Context menu
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const [modalError, setModalError] = useState('');

  /**
   * Utility: handle fetch errors
   */
  async function handleFetchErrors(response) {
    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const data = await response.json();
        if (data.error) errMsg = data.error;
      } catch (_) {
        // If JSON parsing fails, default errMsg stays
      }
      throw new Error(errMsg);
    }
    return response;
  }

  /**
   * Fetch directory contents
   */
  async function getDirectoryItems() {
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/directory/${dirId || ''}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      await handleFetchErrors(response);
      const data = await response.json();

      setDirectoryName(dirId ? data.name : 'My Drive');
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    getDirectoryItems();
    // Reset context menu
    setActiveContextMenu(null);
  }, [dirId]);

  function closeContextMenu() {
    setActiveContextMenu(null);
  }

  /**
   * Details popup
   */
  function openDetailsPopup(item) {
    setDetailsItem(item);
  }

  /**
   * Delete confirmation
   */
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

  /**
   * Decide file icon
   */
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

  /**
   * Click row to open directory or file
   */
  function handleRowClick(type, id) {
    if (type === 'directory') {
      navigate(
        adminMode
          ? `/admin/users/${userId}/directory/${id}`
          : `/directory/${id}`,
      );
    } else {
      window.location.href = `${apiBase}/file/${id}`;
    }
  }

  /**
   * Select multiple files
   */
  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Build a list of "temp" items
    const newItems = selectedFiles.map((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return {
        file,
        name: file.name,
        id: tempId,
        isUploading: false,
      };
    });

    // Put them at the top of the existing list
    setFilesList((prev) => [...newItems, ...prev]);

    // Initialize progress=0 for each
    newItems.forEach((item) => {
      setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));
    });

    // Add them to the uploadQueue
    setUploadQueue((prev) => [...prev, ...newItems]);

    // Clear file input so the same file can be chosen again if needed
    e.target.value = '';

    // Start uploading queue if not already uploading
    if (!isUploading) {
      setIsUploading(true);
      // begin the queue process
      processUploadQueue([...uploadQueue, ...newItems.reverse()]);
    }
  }

  /**
   * Upload items in queue one by one
   */
  function processUploadQueue(queue) {
    if (queue.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => {
        getDirectoryItems();
      }, 1000);
      return;
    }

    // Take first item
    const [currentItem, ...restQueue] = queue;

    setFilesList((prev) =>
      prev.map((f) =>
        f.id === currentItem.id ? { ...f, isUploading: true } : f,
      ),
    );

    const xhr = new XMLHttpRequest();
    const uploadUrl = dirId ? `${apiBase}/file/${dirId}` : `${apiBase}/file`;
    xhr.open('POST', uploadUrl, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('filename', currentItem.name);

    xhr.upload.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        const progress = (evt.loaded / evt.total) * 100;
        setProgressMap((prev) => ({ ...prev, [currentItem.id]: progress }));
      }
    });

    xhr.addEventListener('load', () => {
      processUploadQueue(restQueue);
    });

    setUploadXhrMap((prev) => ({ ...prev, [currentItem.id]: xhr }));
    xhr.send(currentItem.file);
  }

  /**
   * Cancel an in-progress upload
   */
  function handleCancelUpload(tempId) {
    const xhr = uploadXhrMap[tempId];
    if (xhr) {
      xhr.abort();
    }
    // Remove it from queue if still there
    setUploadQueue((prev) => prev.filter((item) => item.id !== tempId));

    // Remove from filesList
    setFilesList((prev) => prev.filter((f) => f.id !== tempId));

    // Remove from progressMap
    setProgressMap((prev) => {
      const { [tempId]: _, ...rest } = prev;
      return rest;
    });

    // Remove from Xhr map
    setUploadXhrMap((prev) => {
      const copy = { ...prev };
      delete copy[tempId];
      return copy;
    });
  }

  /**
   * Delete a file/directory
   */
  async function handleDeleteFile(id) {
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/file/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await handleFetchErrors(response);
      getDirectoryItems();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteDirectory(id) {
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBase}/directory/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await handleFetchErrors(response);
      getDirectoryItems();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Create a directory
   */
  async function handleCreateDirectory(e) {
    e.preventDefault();
    setModalError('');
    try {
      const response = await fetch(`${apiBase}/directory/${dirId || ''}`, {
        method: 'POST',
        headers: { dirname: newDirname },
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        setModalError(data.error || 'Failed to create directory.');
        return;
      }
      setNewDirname('New Folder');
      setShowCreateDirModal(false);
      getDirectoryItems();
    } catch (error) {
      setModalError(error.message);
    }
  }

  /**
   * Rename
   */
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
      const url =
        renameType === 'file'
          ? `${apiBase}/file/${renameId}`
          : `${apiBase}/directory/${renameId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          renameType === 'file'
            ? { newFilename: renameValue }
            : { newDirName: renameValue },
        ),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json();
        setModalError(data.error || 'Failed to rename.');
        return;
      }
      setShowRenameModal(false);
      setRenameValue('');
      setRenameType(null);
      setRenameId(null);
      getDirectoryItems();
    } catch (error) {
      setModalError(error.message);
    }
  }

  /**
   * Context Menu
   */
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

  // Combine directories & files into one list for rendering
  const combinedItems = [
    ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
    ...filesList.map((f) => ({ ...f, isDirectory: false })),
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-4 font-sans text-text">
      {adminMode && (
        <div className="bg-indigo-50 text-primary-hover border border-indigo-200 rounded-lg px-4 py-2.5 text-sm font-medium mt-4">
          Viewing {targetUserLabel || "another user's"} files —{' '}
          {readOnly ? 'read-only' : 'Owner mode'}
        </div>
      )}

      {errorMessage &&
        errorMessage !==
          'Directory not found or you do not have access to it!' && (
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
        disabled={
          errorMessage ===
          'Directory not found or you do not have access to it!'
        }
        readOnly={readOnly}
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
        <DetailsPopup item={detailsItem} onClose={() => setDetailsItem(null)} />
      )}

      {deleteConfirmItem && (
        <ConfirmDeleteModal
          item={deleteConfirmItem}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmItem(null)}
        />
      )}

      {combinedItems.length === 0 ? (
        errorMessage ===
        'Directory not found or you do not have access to it!' ? (
          <p className="text-center italic mt-10 text-text-muted">
            Directory not found or you do not have access to it!
          </p>
        ) : (
          <p className="text-center italic mt-10 text-text-muted">
            This folder is empty. Upload files or create a folder to see some
            data.
          </p>
        )
      ) : (
        <DirectoryList
          items={combinedItems}
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
