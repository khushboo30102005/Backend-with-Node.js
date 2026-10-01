import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { BASE_URL } from '../Register';
import { getFileDownloadUrl } from '../apis/fileApi';

const menuItemClass =
  'px-5 py-2 cursor-pointer whitespace-nowrap text-gray-700 text-sm transition-colors duration-150 hover:bg-gray-100';
const dangerMenuItemClass =
  'px-5 py-2 cursor-pointer whitespace-nowrap text-danger text-sm transition-colors duration-150 hover:bg-red-50';

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
  permission = 'owner', // 'owner' | 'editor' | 'viewer' — default preserves existing behavior everywhere it isn't explicitly set
  onClose,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const menuStyle = { top: contextMenuPos.y, left: contextMenuPos.x };
  const menuBoxClass =
  'fixed bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] rounded-lg border border-border z-[999] py-1.5 animate-menu-pop';

  const canRename = permission === 'owner' || permission === 'editor';
  const canMove = permission === 'owner';
  const canDelete = permission === 'owner';
  const canShare = permission === 'owner';
  const isViewOnly = permission === 'viewer';

  // Trashed items get an entirely separate, simpler menu regardless of
  // permission — an item in Trash is always something the current user
  // owns (only owners see their own Trash), so no permission branching
  // is needed here.

  let content;
  if (item.isTrashed) {
    content = (
      <div className={menuBoxClass} style={menuStyle} ref={menuRef}>
        <div
          className={menuItemClass}
          onClick={() => {
            openDetailsPopup(item);
            onClose();
          }}
        >
          Details
        </div>
        {!item.isDirectory && (
          <div
            className={menuItemClass}
            onClick={() => {
              window.location.href = `${BASE_URL}${getFileDownloadUrl(item.id, apiBase)}`;
              onClose();
            }}
          >
            Download
          </div>
        )}
        <div
          className={menuItemClass}
          onClick={() => {
            onRestore(item);
            onClose();
          }}
        >
          Restore
        </div>
        <div
          className={dangerMenuItemClass}
          onClick={() => {
            openPermanentDeleteConfirm(item);
            onClose();
          }}
        >
          Delete forever
        </div>
      </div>
    );
  }

  if (item.isDirectory) {
    content = (
      <div className={menuBoxClass} style={menuStyle} ref={menuRef}>
        <div
          className={menuItemClass}
          onClick={() => {
            openDetailsPopup(item);
            onClose();
          }}
        >
          Details
        </div>
        {canRename && (
          <div
            className={menuItemClass}
            onClick={() => {
              openRenameModal('directory', item.id, item.name);
              onClose();
            }}
          >
            Rename
          </div>
        )}
        {canMove && (
          <div
            className={menuItemClass}
            onClick={() => {
              openMoveModal([item]);
              onClose();
            }}
          >
            Move
          </div>
        )}
        {canDelete && (
          <div
            className={menuItemClass}
            onClick={() => {
              openDeleteConfirm(item);
              onClose();
            }}
          >
            Move to trash
          </div>
        )}
        {isViewOnly && (
          <div className="px-5 py-2 whitespace-nowrap text-sm text-gray-400 cursor-default">
            View only
          </div>
        )}
      </div>
    );
  } else {
    if (isUploadingItem && item.isUploading) {
      content = (
        <div className={menuBoxClass} style={menuStyle} ref={menuRef}>
          <div
            className={menuItemClass}
            onClick={() => {
              handleCancelUpload(item.id);
              onClose();
            }}
          >
            Cancel
          </div>
        </div>
      );
    } else {
      content = (
        <div className={menuBoxClass} style={menuStyle} ref={menuRef}>
          <div
            className={menuItemClass}
            onClick={() => {
              window.location.href = `${BASE_URL}${getFileDownloadUrl(item.id, apiBase)}`;
              onClose();
            }}
          >
            Download
          </div>
          <div
            className={menuItemClass}
            onClick={() => {
              openDetailsPopup(item);
              onClose();
            }}
          >
            Details
          </div>
          {canShare && (
            <div
              className={menuItemClass}
              onClick={() => {
                openShareModal(item);
                onClose();
              }}
            >
              Share
            </div>
          )}
          {canRename && (
            <div
              className={menuItemClass}
              onClick={() => {
                openRenameModal('file', item.id, item.name);
                onClose();
              }}
            >
              Rename
            </div>
          )}
          {canMove && (
            <div
              className={menuItemClass}
              onClick={() => {
                openMoveModal([item]);
                onClose();
              }}
            >
              Move
            </div>
          )}
          {canDelete && (
            <div
              className={menuItemClass}
              onClick={() => {
                openDeleteConfirm(item);
                onClose();
              }}
            >
              Move to trash
            </div>
          )}
        </div>
      );
    }
  }
  return createPortal(content, document.body);
}

export default ContextMenu;
