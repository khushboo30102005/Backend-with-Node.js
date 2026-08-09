import { useEffect, useRef } from "react";

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  BASE_URL,
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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const menuStyle = { top: contextMenuPos.y, left: contextMenuPos.x };

  if (item.isDirectory) {
    return (
      <div className="context-menu" style={menuStyle} ref={menuRef}>
        {!readOnly && (
          <>
            <div className="context-menu-item" onClick={() => { openRenameModal("directory", item.id, item.name); onClose(); }}>
              Rename
            </div>
            <div className="context-menu-item" onClick={() => { handleDeleteDirectory(item.id); onClose(); }}>
              Delete
            </div>
          </>
        )}
        {readOnly && <div className="context-menu-item context-menu-disabled">View only</div>}
      </div>
    );
  } else {
    if (isUploadingItem && item.isUploading) {
      return (
        <div className="context-menu" style={menuStyle} ref={menuRef}>
          <div className="context-menu-item" onClick={() => { handleCancelUpload(item.id); onClose(); }}>
            Cancel
          </div>
        </div>
      );
    } else {
      return (
        <div className="context-menu" style={menuStyle} ref={menuRef}>
          <div
            className="context-menu-item"
            onClick={() => {
              window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
              onClose();
            }}
          >
            Download
          </div>
          {!readOnly && (
            <>
              <div className="context-menu-item" onClick={() => { openRenameModal("file", item.id, item.name); onClose(); }}>
                Rename
              </div>
              <div className="context-menu-item" onClick={() => { handleDeleteFile(item.id); onClose(); }}>
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