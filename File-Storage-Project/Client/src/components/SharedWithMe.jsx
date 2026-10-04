import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FaShareAlt } from 'react-icons/fa';
import DirectoryHeader from './DirectoryHeader';
import DirectoryList from './DirectoryList';
import DetailsPopup from './DetailsPopup';
import RenameModal from './RenameModal';
import { BASE_URL } from '../Register';
import { getSharedWithMe } from '../apis/shareApi';
import { getFileUrl, renameFile } from '../apis/fileApi';
import { useAutoDismissError } from '../hooks/useAutoDismissError';

function SharedWithMe() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useAutoDismissError();
  const [modalError, setModalError] = useAutoDismissError();
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [detailsItem, setDetailsItem] = useState(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getSharedWithMe();
      setEntries(data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setErrorMessage(
        err.response?.data?.error || 'Could not load shared files.',
      );
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

  // Shared files never support navigation into a folder (folder sharing
  // isn't implemented) — a click always opens the file in a new tab.
  function handleRowClick(type, id) {
    window.open(`${BASE_URL}${getFileUrl(id)}`, '_blank', 'noopener');
  }

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

  // Only reachable for editor-permission files — Rename is the one write
  // action Editors have.
  function openRenameModal(type, id, currentName) {
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    setModalError('');
    try {
      await renameFile(renameId, renameValue);
      setShowRenameModal(false);
      setRenameValue('');
      setRenameId(null);
      load();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to rename.');
    }
  }

  const items = entries.map((entry) => ({
    id: entry.file.id,
    name: entry.file.name,
    size: entry.file.size,
    updatedAt: entry.file.updatedAt,
    isDirectory: false,
    permission: entry.permission,
    sharedBy: entry.sharedBy,
  }));

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-12 font-sans text-text">
      <DirectoryHeader
        directoryName="Shared with me"
        subtitle="Files other people have shared with you."
        readOnly
      />

      {errorMessage && (
        <div className="bg-red-50 text-danger border border-red-200 rounded-lg px-4 py-2.5 text-sm mt-4">
          {errorMessage}
        </div>
      )}

      {showRenameModal && (
        <RenameModal
          renameType="file"
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

      {loading ? (
        <p className="text-center italic mt-10 text-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <FaShareAlt size={20} className="text-primary" />
          </div>
          <p className="font-semibold text-text mb-1">
            Nothing shared with you yet
          </p>
          <p className="text-sm text-text-muted max-w-[280px]">
            Files other people share with you will show up here.
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
          openRenameModal={openRenameModal}
          openDeleteConfirm={() => {}}
          openDetailsPopup={openDetailsPopup}
          openMoveModal={() => {}}
          openShareModal={() => {}}
        />
      )}
    </div>
  );
}

export default SharedWithMe;
