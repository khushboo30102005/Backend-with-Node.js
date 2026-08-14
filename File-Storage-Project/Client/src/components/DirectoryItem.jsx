import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
} from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import ContextMenu from '../components/ContextMenu';

function DirectoryItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  closeContextMenu,
  getFileIcon,
  isUploading,
  uploadProgress,
  handleCancelUpload,
  openRenameModal,
  openDeleteConfirm,
  openDetailsPopup,
  apiBase,
  readOnly = false,
}) {
  // Convert the file icon string to the actual Icon component
  function renderFileIcon(iconString) {
    switch (iconString) {
      case 'pdf':
        return <FaFilePdf />;
      case 'image':
        return <FaFileImage />;
      case 'video':
        return <FaFileVideo />;
      case 'archive':
        return <FaFileArchive />;
      case 'code':
        return <FaFileCode />;
      case 'alt':
      default:
        return <FaFileAlt />;
    }
  }

  const isUploadingItem = item.id.startsWith('temp-');

  return (
    <div
      className="flex flex-col relative gap-1 border border-border rounded-[10px] bg-surface cursor-pointer transition-colors duration-150 hover:bg-surface-hover hover:border-gray-300 hover:shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? 'directory' : 'file', item.id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-3.5 py-3 text-sm font-medium">
          {item.isDirectory ? (
            <FaFolder className="text-[#f5a623] text-[1.25em]" />
          ) : (
            renderFileIcon(getFileIcon(item.name))
          )}
          <span>{item.name}</span>
        </div>

        {/* Three dots for context menu */}
        <div
          className="flex items-center justify-center text-[1.2em] cursor-pointer ml-auto text-text-muted rounded-full p-2 mr-1.5 transition-colors duration-150 hover:bg-gray-100 hover:text-text"
          onClick={(e) => handleContextMenu(e, item.id)}
        >
          <BsThreeDotsVertical />
        </div>
      </div>

      {/* PROGRESS BAR: shown if an item is in queue or actively uploading */}
      {isUploadingItem && (
        <div className="relative bg-gray-100 rounded-full mt-1 mb-2.5 mx-3.5 overflow-hidden">
          <span className="absolute text-[11px] font-semibold left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.2)]">
            {Math.floor(uploadProgress)}%
          </span>
          <div
            className="rounded-full h-4 transition-[width] duration-200"
            style={{
              width: `${uploadProgress}%`,
              background:
                uploadProgress === 100
                  ? '#039203'
                  : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            }}
          ></div>
        </div>
      )}

      {/* Context menu, if active */}
      {activeContextMenu === item.id && (
        <ContextMenu
          item={item}
          contextMenuPos={contextMenuPos}
          isUploadingItem={isUploadingItem}
          handleCancelUpload={handleCancelUpload}
          openRenameModal={openRenameModal}
          openDeleteConfirm={openDeleteConfirm}
          openDetailsPopup={openDetailsPopup}
          apiBase={apiBase}
          readOnly={readOnly}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

export default DirectoryItem;
