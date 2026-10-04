import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
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
import SelectionToolbar from './components/SelectionToolbar';
import BulkDeleteConfirmModal from './components/BulkDeleteConfirmModal';
import { getItemKey } from './utils/itemKey';
import { useSearch } from './context/SearchContext';

import MoveModal from './components/MoveModal';
import { moveDirectory as moveDirectoryApi } from './apis/directoryApi';
import { moveFile as moveFileApi } from './apis/fileApi';

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
import { fetchUser } from './apis/userApi';
import ShareModal from './components/ShareModal';
function DirectoryView() {
  const { dirId } = useParams();
  const navigate = useNavigate();

  const [maxStorageInBytes, setMaxStorageInBytes] = useState(0);
  const [usedStorageInBytes, setUsedStorageInBytes] = useState(0);
  const availableStorageBytes = maxStorageInBytes - usedStorageInBytes;

  const [storageRefreshKey, setStorageRefreshKey] = useState(0);

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [bulkDeleteItems, setBulkDeleteItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [moveItems, setMoveItems] = useState([]);

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

  // Tell the Sidebar to refresh its storage ring after uploads/deletes/moves
  useEffect(() => {
    if (storageRefreshKey > 0) {
      window.dispatchEvent(new Event('storage-changed'));
    }
  }, [storageRefreshKey]);

  const [shareModalItem, setShareModalItem] = useState(null);

  const [directoryName, setDirectoryName] = useState('My Drive');
  const [breadcrumb, setBreadcrumb] = useState([]);

  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);

  // Auto-dismissing error states
  const [errorMessage, setErrorMessage] = useAutoDismissError();
  const [modalError, setModalError] = useAutoDismissError();

  // "Directory not found" is a persistent page state, not a toast, so it
  // must not live in the auto-dismissing error.
  const [dirNotFound, setDirNotFound] = useState(false);

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
  // Ids of queued uploads the user cancelled before their turn came
  const cancelledRef = useRef(new Set());

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Search field lives in the top bar; filtering is still client-side only.
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    setEnabled: setSearchEnabled,
  } = useSearch();

  useEffect(() => {
    setSearchEnabled(true);
    return () => setSearchEnabled(false);
  }, []);

  async function getDirectoryItems() {
    setErrorMessage('');
    setDirNotFound(false);
    try {
      const data = await fetchDirectoryItems(dirId);
      setDirectoryName(dirId ? data.name : 'My Drive');
      setBreadcrumb(data.breadcrumb || []);
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (err.response?.status === 404) {
        setDirNotFound(true);
        return;
      }
      setErrorMessage(err.response?.data?.error || 'Request failed');
    }
  }

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
    setSearchQuery('');
    setSelectedKeys(new Set());
    setSelectionMode(false);
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
      navigate(`/directory/${id}`);
    } else {
      // Open in a new tab so the app (and any running upload) stays alive
      window.open(`${BASE_URL}${getFileUrl(id)}`, '_blank', 'noopener');
    }
  }

  function handleBreadcrumbClick(id) {
    const isRoot = breadcrumb.length > 0 && id === breadcrumb[0].id;
    navigate(isRoot ? '/' : `/directory/${id}`);
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

    // Skip uploads that were cancelled while waiting in the queue
    if (cancelledRef.current.has(currentItem.id)) {
      cancelledRef.current.delete(currentItem.id);
      processUploadQueue(restQueue);
      return;
    }

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
      undefined,
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
    cancelledRef.current.add(tempId);

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
      await deleteFileApi(id);
      getDirectoryItems();
      setStorageRefreshKey((prev) => prev + 1);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to delete file.');
    }
  }

  async function handleDeleteDirectory(id) {
    setErrorMessage('');
    try {
      await deleteDirectoryApi(id);
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
      await createDirectoryApi(dirId, newDirname);
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
        await renameFileApi(renameId, renameValue);
      } else {
        await renameDirectoryApi(renameId, renameValue);
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

  const query = searchQuery.trim().toLowerCase();
  const visibleItems = query
    ? combinedItems.filter((item) => item.name.toLowerCase().includes(query))
    : combinedItems;

  const isDirNotFoundError = dirNotFound;

  const selectableItems = visibleItems.filter(
    (item) => !item.id.startsWith('temp-'),
  );

  function handleToggleSelect(item) {
    if (item.id.startsWith('temp-')) return;

    const key = getItemKey(item);
    setSelectionMode(true);

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectableItems.length === 0) return;
    setSelectionMode(true);

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const everySelected = selectableItems.every((item) =>
        next.has(getItemKey(item)),
      );
      selectableItems.forEach((item) => {
        if (everySelected) next.delete(getItemKey(item));
        else next.add(getItemKey(item));
      });
      return next;
    });
  }

  function handleClearSelection() {
    setSelectedKeys(new Set());
  }

  // Leave selection mode automatically once nothing is selected
  useEffect(() => {
    if (selectedKeys.size === 0) setSelectionMode(false);
  }, [selectedKeys]);

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedKeys.has(getItemKey(item)));

  const selectedItems = combinedItems.filter((item) =>
    selectedKeys.has(getItemKey(item)),
  );
  function openBulkDeleteConfirm() {
    if (selectedItems.length === 0) return;

    setBulkDeleteItems(selectedItems);
  }

  async function confirmBulkDelete(items) {
    if (!items || items.length === 0) return;

    setErrorMessage('');

    const results = await Promise.allSettled(
      items.map((item) =>
        item.isDirectory ? deleteDirectoryApi(item.id) : deleteFileApi(item.id),
      ),
    );

    const failedCount = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    setBulkDeleteItems([]);
    setSelectedKeys(new Set());

    await getDirectoryItems();
    setStorageRefreshKey((prev) => prev + 1);

    if (failedCount > 0) {
      setErrorMessage(
        `${failedCount} ${
          failedCount === 1 ? 'item' : 'items'
        } could not be deleted.`,
      );
    }
  }

  function openMoveModal(items) {
    setMoveItems(items);
  }

  async function handleMoveConfirm(destinationId) {
    const targets = moveItems;
    const results = await Promise.allSettled(
      targets.map((item) =>
        item.isDirectory
          ? moveDirectoryApi(item.id, destinationId)
          : moveFileApi(item.id, destinationId),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected');

    setMoveItems([]);
    setSelectedKeys(new Set());
    await getDirectoryItems();
    setStorageRefreshKey((prev) => prev + 1);

    if (failed.length > 0) {
      setErrorMessage(
        `${failed.length} of ${targets.length} item${targets.length === 1 ? '' : 's'} could not be moved.`,
      );
    }
  }

  function openShareModal(item) {
    setShareModalItem(item);
  }
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-28 sm:pb-12 font-sans text-text">
      <BreadcrumbBar
        breadcrumb={breadcrumb}
        onBreadcrumbClick={handleBreadcrumbClick}
      />
      {errorMessage && (
        <div className="bg-red-50 text-danger border border-red-200 rounded-lg px-4 py-2.5 text-sm mt-4">
          {errorMessage}
        </div>
      )}
      <DirectoryHeader
        directoryName={directoryName}
        subtitle={
          dirId ? undefined : 'Your files and folders, all in one place.'
        }
        onCreateFolderClick={() => setShowCreateDirModal(true)}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={isDirNotFoundError}
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
      {shareModalItem && (
        <ShareModal
          file={shareModalItem}
          onClose={() => setShareModalItem(null)}
        />
      )}
      {moveItems.length > 0 && (
        <MoveModal
          items={moveItems}
          onConfirm={handleMoveConfirm}
          onCancel={() => setMoveItems([])}
        />
      )}
      {detailsItem && (
        <DetailsPopup
          item={detailsItem}
          breadcrumb={breadcrumb}
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

      {bulkDeleteItems.length > 0 && (
        <BulkDeleteConfirmModal
          items={bulkDeleteItems}
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkDeleteItems([])}
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-surface border border-border text-text cursor-pointer hover:bg-surface-hover transition-colors"
            >
              <FaUpload size={11} />
              Upload
            </button>
          </div>
        </div>
      ) : query && visibleItems.length === 0 ? (
        <p className="text-center italic mt-10 text-text-muted">
          No files or folders match "{searchQuery}".
        </p>
      ) : (
        <>
          {selectableItems.length > 0 && (
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleToggleSelect}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 ${
                  selectionMode
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'bg-surface text-text border-border hover:bg-surface-hover hover:border-border-strong'
                }`}
              >
                {selectionMode ? 'Cancel selection' : 'Select'}
              </button>
            </div>
          )}
          <SelectionToolbar
            selectedCount={selectedItems.length}
            totalCount={selectableItems.length}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedKeys(new Set())}
            onDelete={openBulkDeleteConfirm}
            onMove={() => openMoveModal(selectedItems)}
          />
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
            openMoveModal={openMoveModal}
            openShareModal={openShareModal}
            selectedKeys={selectedKeys}
            onToggleSelect={handleToggleSelect}
            selectionMode={selectionMode}
            selectedCount={selectedItems.length}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            toolbar={
              <SelectionToolbar
                selectedCount={selectedItems.length}
                totalCount={selectableItems.length}
                allSelected={allSelected}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onDelete={openBulkDeleteConfirm}
                onMove={() => openMoveModal(selectedItems)}
              />
            }
          />
        </>
      )}
    </div>
  );
}

export default DirectoryView;
