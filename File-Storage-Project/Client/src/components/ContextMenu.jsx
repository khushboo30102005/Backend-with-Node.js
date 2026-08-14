import { useEffect, useRef } from 'react';
import { BASE_URL } from '../Register';
import { getFileDownloadUrl } from '../apis/fileApi';

const menuItemClass =
  'px-5 py-2 cursor-pointer whitespace-nowrap text-gray-700 text-sm transition-colors duration-150 hover:bg-gray-100';

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  openRenameModal,
  openDeleteConfirm,
  openDetailsPopup,
  apiBase,
  readOnly = false,
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
    'fixed bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] rounded-lg border border-border z-[999] py-1.5';

  if (item.isDirectory) {
    return (
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
        {!readOnly && (
          <>
            <div
              className={menuItemClass}
              onClick={() => {
                openRenameModal('directory', item.id, item.name);
                onClose();
              }}
            >
              Rename
            </div>
            <div
              className={menuItemClass}
              onClick={() => {
                openDeleteConfirm(item);
                onClose();
              }}
            >
              Delete
            </div>
          </>
        )}
        {readOnly && (
          <div className="px-5 py-2 whitespace-nowrap text-sm text-gray-400 cursor-default">
            View only
          </div>
        )}
      </div>
    );
  } else {
    if (isUploadingItem && item.isUploading) {
      return (
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
      return (
        <div className={menuBoxClass} style={menuStyle} ref={menuRef}>
          <div
            className={menuItemClass}
            onClick={() => {
              window.location.href = `${getFileDownloadUrl(item.id, apiBase)}`;
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
          {!readOnly && (
            <>
              <div
                className={menuItemClass}
                onClick={() => {
                  openRenameModal('file', item.id, item.name);
                  onClose();
                }}
              >
                Rename
              </div>
              <div
                className={menuItemClass}
                onClick={() => {
                  openDeleteConfirm(item);
                  onClose();
                }}
              >
                Delete
              </div>
            </>
          )}
        </div>
      );
    }
  }
}

export default ContextMenu;
