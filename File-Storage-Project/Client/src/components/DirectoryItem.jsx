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
import { formatSize } from './DetailsPopup';

const FILE_ICON_STYLES = {
  pdf: { icon: FaFilePdf, color: 'text-red-500', bg: 'bg-red-50' },
  image: { icon: FaFileImage, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  video: { icon: FaFileVideo, color: 'text-purple-500', bg: 'bg-purple-50' },
  archive: { icon: FaFileArchive, color: 'text-amber-600', bg: 'bg-amber-50' },
  code: { icon: FaFileCode, color: 'text-blue-500', bg: 'bg-blue-50' },
  alt: { icon: FaFileAlt, color: 'text-gray-500', bg: 'bg-gray-100' },
};

function formatModified(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  openMoveModal,
  openShareModal,
  onRestore,
  openPermanentDeleteConfirm,
  apiBase,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) {
  const isUploadingItem = item.id.startsWith('temp-');
  const fileStyle = !item.isDirectory
    ? FILE_ICON_STYLES[getFileIcon(item.name)] || FILE_ICON_STYLES.alt
    : null;
  const FileIconComponent = fileStyle?.icon;

  const permission = item.permission || 'owner';
  const canSelect = permission === 'owner';

  return (
    <div
      className="flex flex-col relative gap-1 border border-border rounded-[10px] bg-surface cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-hover hover:border-gray-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.99]"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? 'directory' : 'file', item.id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        {canSelect && !isUploadingItem && selectionMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 shrink-0 cursor-pointer accent-primary"
            aria-label={`Select ${item.name}`}
          />
        )}
        {/* Icon */}
        {item.isDirectory ? (
          <span className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FaFolder className="text-amber-500 text-base" />
          </span>
        ) : (
          <span
            className={`w-9 h-9 rounded-lg ${fileStyle.bg} flex items-center justify-center flex-shrink-0`}
          >
            <FileIconComponent className={`${fileStyle.color} text-base`} />
          </span>
        )}

        {/* Name */}
        <span
          className="text-sm font-medium text-text truncate min-w-0 flex-shrink"
          title={item.name}
        >
          {item.name}
        </span>

        {/* Metadata — hidden on very small screens to avoid crowding */}
        {!isUploadingItem && (
          <div className="hidden sm:flex items-center gap-4 ml-auto flex-shrink-0 text-xs text-text-muted">
            {typeof item.size === 'number' && (
              <span>{formatSize(item.size)}</span>
            )}
            {item.updatedAt && <span>{formatModified(item.updatedAt)}</span>}
          </div>
        )}

        {/* Three dots for context menu */}
        <div
          className={`flex items-center justify-center text-[1.2em] cursor-pointer flex-shrink-0 text-text-muted rounded-full p-2 transition-colors duration-150 hover:bg-gray-100 hover:text-text ${isUploadingItem ? '' : 'sm:ml-0 ml-auto'}`}
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
          openMoveModal={openMoveModal}
          openDetailsPopup={openDetailsPopup}
          openShareModal={openShareModal}
          onRestore={onRestore}
          openPermanentDeleteConfirm={openPermanentDeleteConfirm}
          apiBase={apiBase}
          permission={permission}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

export default DirectoryItem;