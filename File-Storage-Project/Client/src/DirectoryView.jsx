import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
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
import { useUser } from './context/UserContext';

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
  getFileDownloadUrl,
} from './apis/fileApi';
import ShareModal from './components/ShareModal';
import BulkShareModal from './components/BulkShareModal';

export const MY_DRIVE_PATH = '/mydrive';
export const folderPath = (id) => `${MY_DRIVE_PATH}/folder/${id}`;

function ListingSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-5 animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 rounded-xl border border-border bg-surface-muted/60" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 bg-surface-muted/30" />
        ))}
      </div>
    </div>
  );
}

function DirectoryView({ dirId }) {
  const navigate = useNavigate();
  const { user, dirCache } = useUser();

  // Storage numbers come from the shared user; the shell refreshes them
  // whenever 'storage-changed' fires (see storageRefreshKey effect below).
  const maxStorageInBytes = user?.maxStorageInBytes || 0;
  const usedStorageInBytes = user?.usedStorageInBytes || 0;
  const availableStorageBytes = maxStorageInBytes - usedStorageInBytes;

  const cacheKey = dirId || 'root';
  const cached = dirCache.get(cacheKey);

  // Always-current dir id for async work that outlives a render
  const dirIdRef = useRef(dirId);
  dirIdRef.current = dirId;
  const requestRef = useRef(0);

  const [storageRefreshKey, setStorageRefreshKey] = useState(0);

  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkDeleteItems, setBulkDeleteItems] = useState([]);
  const [moveItems, setMoveItems] = useState([]);
  const [bulkShareItems, setBulkShareItems] = useState([]);

  // Tell the shell (sidebar ring, etc.) to refresh storage after changes
  useEffect(() => {
    if (storageRefreshKey > 0) {
      window.dispatchEvent(new Event('storage-changed'));
    }
  }, [storageRefreshKey]);

  const [shareModalItem, setShareModalItem] = useState(null);

  const [directoryName, setDirectoryName] = useState(cached?.name || 'My Drive');
  const [breadcrumb, setBreadcrumb] = useState(cached?.breadcrumb || []);
  const [directoriesList, setDirectoriesList] = useState(
    cached ? [...cached.directories].reverse() : [],
  );
  const [filesList, setFilesList] = useState(
    cached ? [...cached.files].reverse() : [],
  );
  // First paint of a folder we have nothing for: show a skeleton, not "Nothing here yet"
  const [loading, setLoading] = useState(!cached);

  const [errorMessage, setErrorMessage] = useAutoDismissError();
  const [modalError, setModalError] = useAutoDismissError();
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
  const cancelledRef = useRef(new Set());

  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    setEnabled: setSearchEnabled,
  } = useSearch();

  useEffect(() => {
    setSearchEnabled(true);
    return () => setSearchEnabled(false);
  }, []);

  function applyListing(entry) {
    setDirectoryName(entry.name);
    setBreadcrumb(entry.breadcrumb);
    setDirectoriesList([...entry.directories].reverse());
    setFilesList([...entry.files].reverse());
  }

  // Always fetches the folder currently in the URL, and ignores responses
  // that were overtaken by a newer request (fast folder → folder clicks).
  async function getDirectoryItems() {
    const targetId = dirIdRef.current;
    const key = targetId || 'root';
    const requestId = ++requestRef.current;
    setErrorMessage('');
    try {
      const data = await fetchDirectoryItems(targetId);
      const entry = {
        name: targetId ? data.name : 'My Drive',
        breadcrumb: data.breadcrumb || [],
        directories: data.directories,
        files: data.files,
      };
      dirCache.set(key, entry);
      if (requestId !== requestRef.current) return;
      setDirNotFound(false);
      applyListing(entry);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (err.response?.status === 404) {
        dirCache.delete(key);
        setDirNotFound(true);
        return;
      }
      setErrorMessage(err.response?.data?.error || 'Request failed');
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }

  // Folder changed (or first mount): paint cached listing instantly if we
  // have one, then revalidate in the background.
  useEffect(() => {
    const entry = dirCache.get(cacheKey);
    setDirNotFound(false);
    if (entry) {
      applyListing(entry);
      setLoading(false);
    } else {
      setDirectoriesList([]);
      setFilesList([]);
      setDirectoryName(dirId ? '' : 'My Drive');
      setLoading(true);
    }
    getDirectoryItems();
    setActiveContextMenu(null);
    setSearchQuery('');
    cancelSelection();
  }, [dirId]);

  // Escape leaves selection mode
  useEffect(() => {
    if (!selectionMode) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('[class*="z-[999]"]')) {
        cancelSelection();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectionMode]);

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
      navigate(folderPath(id));
    } else {
      // Open in a new tab so the app (and any running upload) stays alive
      window.open(`${BASE_URL}${getFileUrl(id)}`, '_blank', 'noopener');
    }
  }

  function handleBreadcrumbClick(id) {
    const isRoot = breadcrumb.length > 0 && id === breadcrumb[0].id;
    navigate(isRoot ? MY_DRIVE_PATH : folderPath(id));
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

  const selectableItems = visibleItems.filter(
    (item) => !item.id.startsWith('temp-'),
  );

  // ---- selection mode -------------------------------------------------
  function enterSelection() {
    setSelectionMode(true);
  }

  function cancelSelection() {
    setSelectionMode(false);
    setSelectedKeys(new Set());
  }

  function handleToggleSelect(item) {
    if (item.id.startsWith('temp-')) return;
    const key = getItemKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Select / deselect a group of items (everything, or just the files)
  function toggleGroup(group) {
    if (group.length === 0) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const everySelected = group.every((item) => next.has(getItemKey(item)));
      group.forEach((item) => {
        if (everySelected) next.delete(getItemKey(item));
        else next.add(getItemKey(item));
      });
      return next;
    });
  }

  const selectableFiles = selectableItems.filter((item) => !item.isDirectory);

  // Toolbar checkbox = every folder and file
  function handleSelectAll() {
    toggleGroup(selectableItems);
  }

  // Files-table header checkbox = files only
  function handleSelectAllFiles() {
    toggleGroup(selectableFiles);
  }

  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedKeys.has(getItemKey(item)));

  const selectedItems = combinedItems.filter((item) =>
    selectedKeys.has(getItemKey(item)),
  );

  const selectedFileCount = selectedItems.filter((i) => !i.isDirectory).length;
  const allFilesSelected =
    selectableFiles.length > 0 &&
    selectableFiles.every((item) => selectedKeys.has(getItemKey(item)));

  const selectedRealFiles = selectedItems.filter(
    (i) => !i.isDirectory && !i.id.startsWith('temp-'),
  );
  const selectedFolderCount = selectedItems.filter((i) => i.isDirectory).length;

  // Downloads each selected file through the existing single-file endpoint
  // (it redirects to a signed attachment URL). There is no zip/folder download
  // on the server, so folders are skipped. Staggered so browsers accept it.
  function handleBulkDownload() {
    if (selectedRealFiles.length === 0) return;
    selectedRealFiles.forEach((file, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = `${BASE_URL}${getFileDownloadUrl(file.id)}`;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 700);
    });
    if (selectedFolderCount > 0) {
      setErrorMessage(
        `${selectedFolderCount} ${selectedFolderCount === 1 ? 'folder was' : 'folders were'} skipped — only files can be downloaded.`,
      );
    }
  }

  function handleBulkShare() {
    if (selectedRealFiles.length === 0) return;
    setBulkShareItems(selectedRealFiles);
  }

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
    cancelSelection();

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
    cancelSelection();
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

  const showSkeleton = loading && combinedItems.length === 0 && !dirNotFound;

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-7 pt-3 sm:pt-4 pb-24 sm:pb-8 font-sans text-text">
      {/* One row: where am I (left) + the single selection control (right) */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-h-9">
        <div className="min-w-0 flex-1 basis-56">
          <BreadcrumbBar
            breadcrumb={breadcrumb}
            onBreadcrumbClick={handleBreadcrumbClick}
          />
        </div>
        {!dirNotFound && !showSkeleton && (
          <SelectionToolbar
            selectionMode={selectionMode}
            onEnter={enterSelection}
            onCancel={cancelSelection}
            selectedCount={selectedItems.length}
            totalCount={selectableItems.length}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            onDelete={openBulkDeleteConfirm}
            onMove={() => openMoveModal(selectedItems)}
            onDownload={handleBulkDownload}
            onShare={handleBulkShare}
            canDownload={selectedRealFiles.length > 0}
            canShare={selectedRealFiles.length > 0}
          />
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-danger border border-red-200 rounded-lg px-4 py-2 text-sm mt-3">
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
        disabled={dirNotFound}
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
      {bulkShareItems.length > 0 && (
        <BulkShareModal
          files={bulkShareItems}
          skippedFolders={selectedFolderCount}
          onClose={() => setBulkShareItems([])}
          onDone={cancelSelection}
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

      {dirNotFound ? (
        <p className="text-center italic mt-10 text-text-muted">
          Directory not found or you do not have access to it!
        </p>
      ) : showSkeleton ? (
        <ListingSkeleton />
      ) : combinedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 px-4">
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
          selectedCount={selectedFileCount}
          allSelected={allFilesSelected}
          onSelectAll={handleSelectAllFiles}
        />
      )}
    </div>
  );
}

export default function MyDrive() {
  const splat = useParams()['*'] || '';
  const match = splat.match(/^folder\/([^/]+)\/?$/);
  if (splat && !match) return <Navigate to={MY_DRIVE_PATH} replace />;
  return <DirectoryView dirId={match ? match[1] : undefined} />;
}