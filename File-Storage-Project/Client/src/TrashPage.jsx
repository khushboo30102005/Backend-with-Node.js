import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FaTrash } from 'react-icons/fa';
import DirectoryHeader from './components/DirectoryHeader';
import DirectoryList from './components/DirectoryList';
import DetailsPopup from './components/DetailsPopup';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { getTrash } from './apis/trashApi';
import {
  restoreDirectory,
  permanentlyDeleteDirectory,
} from './apis/directoryApi';
import { restoreFile, permanentlyDeleteFile } from './apis/fileApi';
import { useAutoDismissError } from './hooks/useAutoDismissError';

function TrashPage() {
  const navigate = useNavigate();
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useAutoDismissError();
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [detailsItem, setDetailsItem] = useState(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getTrash();
      setDirectories(data.directories || []);
      setFiles(data.files || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setErrorMessage(err.response?.data?.error || 'Could not load Trash.');
    } finally {
      setLoading(false);
    }
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

  // Trashed items aren't browsable — all actions happen via the context menu.
  function handleRowClick() {}

  function handleContextMenu(e, id) {
    e.stopPropagation();
    e.preventDefault();
    if (activeContextMenu === id) {
      setActiveContextMenu(null);
    } else {
      setActiveContextMenu(id);
      setContextMenuPos({ x: e.clientX - 110, y: e.clientY });
    }
  }

  function closeContextMenu() {
    setActiveContextMenu(null);
  }

  function openDetailsPopup(item) {
    setDetailsItem(item);
  }

  async function handleRestore(item) {
    setErrorMessage('');
    try {
      if (item.isDirectory) {
        await restoreDirectory(item.id);
      } else {
        await restoreFile(item.id);
      }
      load();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Could not restore item.');
    }
  }

  function openPermanentDeleteConfirm(item) {
    setPermanentDeleteItem(item);
  }

  async function confirmPermanentDelete(item) {
    setErrorMessage('');
    try {
      if (item.isDirectory) {
        await permanentlyDeleteDirectory(item.id);
      } else {
        await permanentlyDeleteFile(item.id);
      }
      setPermanentDeleteItem(null);
      load();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'Could not permanently delete item.',
      );
    }
  }

  async function handleEmptyTrash() {
    const allItems = [...directories, ...files];
    if (allItems.length === 0) return;
    if (
      !confirm(
        `Permanently delete all ${allItems.length} item(s) in Trash? This cannot be undone.`,
      )
    ) {
      return;
    }
    setErrorMessage('');
    const results = await Promise.allSettled(
      allItems.map((item) =>
        item.isDirectory
          ? permanentlyDeleteDirectory(item.id)
          : permanentlyDeleteFile(item.id),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      setErrorMessage(`${failed} item(s) could not be deleted.`);
    }
    load();
  }

  const items = [
    ...directories.map((d) => ({ ...d, isTrashed: true })),
    ...files.map((f) => ({ ...f, isTrashed: true })),
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-12 font-sans text-text">
      <DirectoryHeader
        directoryName="Trash"
        subtitle="Items stay here until you delete them forever."
        readOnly
      />

      {errorMessage && (
        <div className="bg-red-50 text-danger border border-red-200 rounded-lg px-4 py-2.5 text-sm mt-4">
          {errorMessage}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="min-h-11 px-3 text-sm font-semibold text-danger hover:underline transition-colors cursor-pointer"
          >
            Empty Trash
          </button>
        </div>
      )}

      {detailsItem && (
        <DetailsPopup item={detailsItem} onClose={() => setDetailsItem(null)} />
      )}

      {permanentDeleteItem && (
        <ConfirmDeleteModal
          item={permanentDeleteItem}
          permanent
          onConfirm={confirmPermanentDelete}
          onCancel={() => setPermanentDeleteItem(null)}
        />
      )}

      {loading ? (
        <p className="text-center italic mt-10 text-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <FaTrash size={20} className="text-primary" />
          </div>
          <p className="font-semibold text-text mb-1">Trash is empty</p>
          <p className="text-sm text-text-muted max-w-[280px]">
            Files and folders you delete will show up here before being
            permanently removed.
          </p>
        </div>
      ) : (
        <DirectoryList
          items={items}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          contextMenuPos={contextMenuPos}
          handleContextMenu={handleContextMenu}
          closeContextMenu={closeContextMenu}
          getFileIcon={getFileIcon}
          isUploading={false}
          progressMap={{}}
          handleCancelUpload={() => {}}
          openRenameModal={() => {}}
          openDeleteConfirm={() => {}}
          openDetailsPopup={openDetailsPopup}
          openMoveModal={() => {}}
          openShareModal={() => {}}
          onRestore={handleRestore}
          openPermanentDeleteConfirm={openPermanentDeleteConfirm}
        />
      )}
    </div>
  );
}

export default TrashPage;
