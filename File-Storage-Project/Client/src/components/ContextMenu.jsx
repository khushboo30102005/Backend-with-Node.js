import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FaDownload,
  FaInfoCircle,
  FaShareAlt,
  FaPen,
  FaArrowsAlt,
  FaTrash,
  FaUndo,
  FaTimes,
} from 'react-icons/fa';
import { BASE_URL } from '../Register';
import { getFileDownloadUrl } from '../apis/fileApi';

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  openRenameModal,
  openDeleteConfirm,
  openMoveModal,
  openDetailsPopup,
  openShareModal,
  onRestore,
  openPermanentDeleteConfirm,
  apiBase,
  permission = 'owner', // 'owner' | 'editor' | 'viewer'
  onClose,
}) {
  const menuRef = useRef(null);
  // Phones get a bottom sheet instead of a floating popover
  const [isMobile] = useState(
    () => window.matchMedia('(max-width: 639px)').matches,
  );
  const [pos, setPos] = useState(contextMenuPos);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Keep the desktop popover fully inside the viewport
  useLayoutEffect(() => {
    if (isMobile || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const margin = 8;
    setPos({
      x: Math.max(
        margin,
        Math.min(contextMenuPos.x, window.innerWidth - rect.width - margin),
      ),
      y: Math.max(
        margin,
        Math.min(contextMenuPos.y, window.innerHeight - rect.height - margin),
      ),
    });
  }, [contextMenuPos, isMobile]);

  const canRename = permission === 'owner' || permission === 'editor';
  const canMove = permission === 'owner';
  const canDelete = permission === 'owner';
  const canShare = permission === 'owner';
  const isViewOnly = permission === 'viewer';

  const entry = (key, icon, label, action, danger = false) => ({
    key,
    icon,
    label,
    danger,
    action: () => {
      action();
      onClose();
    },
  });

  let entries = [];
  let viewOnlyNote = false;

  if (item.isTrashed) {
    // Trashed items get a separate, simpler menu (files in Trash can't be
    // downloaded - the server treats them as not found).
    entries = [
      entry('details', FaInfoCircle, 'Details', () => openDetailsPopup(item)),
      entry('restore', FaUndo, 'Restore', () => onRestore(item)),
      entry(
        'forever',
        FaTrash,
        'Delete forever',
        () => openPermanentDeleteConfirm(item),
        true,
      ),
    ];
  } else if (item.isDirectory) {
    entries = [
      entry('details', FaInfoCircle, 'Details', () => openDetailsPopup(item)),
      canRename &&
        entry('rename', FaPen, 'Rename', () =>
          openRenameModal('directory', item.id, item.name),
        ),
      canMove &&
        entry('move', FaArrowsAlt, 'Move', () => openMoveModal([item])),
      canDelete &&
        entry('trash', FaTrash, 'Move to trash', () => openDeleteConfirm(item)),
    ].filter(Boolean);
    viewOnlyNote = isViewOnly;
  } else if (isUploadingItem) {
    // Any queued or in-progress upload (temp- id) only offers Cancel
    entries = [
      entry('cancel', FaTimes, 'Cancel upload', () =>
        handleCancelUpload(item.id),
      ),
    ];
  } else {
    entries = [
      entry('download', FaDownload, 'Download', () => {
        window.location.href = `${BASE_URL}${getFileDownloadUrl(item.id, apiBase)}`;
      }),
      entry('details', FaInfoCircle, 'Details', () => openDetailsPopup(item)),
      canShare &&
        entry('share', FaShareAlt, 'Share', () => openShareModal(item)),
      canRename &&
        entry('rename', FaPen, 'Rename', () =>
          openRenameModal('file', item.id, item.name),
        ),
      canMove &&
        entry('move', FaArrowsAlt, 'Move', () => openMoveModal([item])),
      canDelete &&
        entry('trash', FaTrash, 'Move to trash', () => openDeleteConfirm(item)),
    ].filter(Boolean);
  }

  const rows = (
    <>
      {entries.map(({ key, icon: Icon, label, danger, action }) => (
        <button
          key={key}
          type="button"
          role="menuitem"
          onClick={action}
          className={`flex items-center gap-3.5 w-full min-h-12 sm:min-h-0 px-3.5 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-[15px] sm:text-sm text-left whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:bg-surface-muted ${
            danger
              ? 'text-danger hover:bg-danger/10'
              : 'text-text hover:bg-surface-muted'
          }`}
        >
          <Icon size={15} className={danger ? '' : 'text-text-muted'} />
          {label}
        </button>
      ))}
      {viewOnlyNote && (
        <div className="px-3.5 py-2.5 sm:py-2 text-sm text-text-muted cursor-default">
          View only
        </div>
      )}
    </>
  );

  const content = isMobile ? (
    <>
      <div
        className="fixed inset-0 z-[990] bg-black/55 animate-backdrop"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        role="menu"
        className="fixed inset-x-0 bottom-0 z-[991] rounded-t-3xl border-t border-border bg-surface px-3 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.3)] animate-sheet-up"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        <p className="px-3.5 pb-2 text-sm font-semibold text-text-muted truncate">
          {item.name}
        </p>
        {rows}
      </div>
    </>
  ) : (
    <div
      ref={menuRef}
      role="menu"
      className="fixed bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.1)] rounded-xl border border-border z-[999] p-1.5 min-w-[180px] animate-menu-pop"
      style={{ top: pos.y, left: pos.x }}
    >
      {rows}
    </div>
  );

  return createPortal(content, document.body);
}

export default ContextMenu;