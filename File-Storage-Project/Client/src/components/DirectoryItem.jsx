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

const FILE_STYLES = {
  pdf: { icon: FaFilePdf, gradient: 'from-rose-400 to-red-600' },
  image: { icon: FaFileImage, gradient: 'from-emerald-400 to-emerald-600' },
  video: { icon: FaFileVideo, gradient: 'from-orange-400 to-orange-600' },
  archive: { icon: FaFileArchive, gradient: 'from-violet-400 to-purple-600' },
  code: { icon: FaFileCode, gradient: 'from-cyan-400 to-blue-600' },
  alt: { icon: FaFileAlt, gradient: 'from-sky-400 to-blue-500' },
};

const TYPE_LABELS = {
  pdf: 'Document',
  image: 'Image',
  video: 'Video',
  archive: 'Archive',
  code: 'Code',
  alt: 'File',
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

function getExtension(name = '') {
  const i = name.lastIndexOf('.');
  return i > 0 && i < name.length - 1 ? name.slice(i + 1).toUpperCase() : '';
}

// One file row. On phones it reads as a card-style list item
// (name + "EXT • size • date" + big 3-dot target); from 640px up the
// size / modified columns appear and line up with the table header.
function DirectoryItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  closeContextMenu,
  getFileIcon,
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
  const iconKey = !item.isDirectory ? getFileIcon(item.name) : null;
  const fileStyle = !item.isDirectory
    ? FILE_STYLES[iconKey] || FILE_STYLES.alt
    : null;
  const FileIconComponent = fileStyle?.icon;

  const permission = item.permission || 'owner';
  const selectable = Boolean(onToggleSelect);
  const canSelect = permission === 'owner' && selectable;

  const ext = item.isDirectory ? '' : getExtension(item.name);
  const hasSize = typeof item.size === 'number';
  const modified = item.updatedAt ? formatModified(item.updatedAt) : '';

  const desktopSub = item.isDirectory
    ? 'Folder'
    : [TYPE_LABELS[iconKey] || TYPE_LABELS.alt, ext].filter(Boolean).join(' • ');
  const mobileSub = [
    ext,
    !isUploadingItem && hasSize ? formatSize(item.size) : null,
    !isUploadingItem ? modified : null,
  ]
    .filter(Boolean)
    .join(' • ');

  function handleClick() {
    // Only this row's own upload state matters, not whether *any* upload runs
    if (activeContextMenu || isUploadingItem) return;
    if (selectionMode) {
      if (canSelect) onToggleSelect(item);
      return;
    }
    handleRowClick(item.isDirectory ? 'directory' : 'file', item.id);
  }

  return (
    <div
      className={`relative flex flex-col cursor-pointer transition-colors duration-150 ${
        isSelected
          ? 'bg-primary/10 hover:bg-primary/15 shadow-[inset_3px_0_0_var(--color-primary)]'
          : 'hover:bg-surface-hover'
      }`}
      onClick={handleClick}
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      <div className="flex items-center gap-3 pl-2 pr-1 sm:px-4 py-2.5 sm:py-3 min-h-[68px]">
        {/* Checkbox slot — kept (empty) on uploading rows so columns stay aligned */}
        {selectable && (
          <span
            className="flex items-center justify-center flex-shrink-0 w-11 h-11 sm:w-8 sm:h-8 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (canSelect && !isUploadingItem) onToggleSelect(item);
            }}
          >
            {canSelect && !isUploadingItem && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="app-checkbox"
                aria-label={`Select ${item.name}`}
              />
            )}
          </span>
        )}

        {/* Icon */}
        {item.isDirectory ? (
          <span className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FaFolder className="text-amber-400 text-lg" />
          </span>
        ) : (
          <span
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${fileStyle.gradient} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}
          >
            <FileIconComponent className="text-white" size={14} />
            {ext && (
              <span className="mt-0.5 text-[7px] leading-none font-extrabold tracking-wide text-white/95">
                {ext.slice(0, 4)}
              </span>
            )}
          </span>
        )}

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] sm:text-sm font-semibold text-text truncate"
            title={item.name}
          >
            {item.name}
          </p>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            <span className="sm:hidden">{mobileSub}</span>
            <span className="hidden sm:inline">{desktopSub}</span>
          </p>
        </div>

        {/* Size / modified columns (≥ 640px) */}
        {!isUploadingItem && (
          <>
            <span className="hidden sm:block w-24 flex-shrink-0 text-sm text-text-muted">
              {hasSize ? formatSize(item.size) : ''}
            </span>
            <span className="hidden sm:block w-28 flex-shrink-0 text-sm text-text-muted">
              {modified}
            </span>
          </>
        )}
        {isUploadingItem && (
          <>
            <span className="hidden sm:block w-24 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:block w-28 flex-shrink-0" aria-hidden="true" />
          </>
        )}

        {/* Actions: 44px touch target on phones */}
        <div
          className="flex items-center justify-center flex-shrink-0 w-11 h-11 sm:w-16 sm:h-10 rounded-full sm:rounded-xl text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => handleContextMenu(e, item.id)}
          role="button"
          aria-label={`Actions for ${item.name}`}
        >
          <BsThreeDotsVertical size={17} />
        </div>
      </div>

      {/* PROGRESS BAR: shown if an item is in queue or actively uploading */}
      {isUploadingItem && (
        <div className="relative bg-surface-muted rounded-full mb-3 mx-3 sm:mx-4 overflow-hidden">
          <span className="absolute text-[11px] font-semibold left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.25)]">
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

      {/* Context menu (popover on desktop, bottom sheet on phones) */}
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