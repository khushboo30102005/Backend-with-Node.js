import { FaFolder } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import ContextMenu from '../components/ContextMenu';
import { formatSize } from './DetailsPopup';

function DirectoryGridItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  closeContextMenu,
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
  const permission = item.permission || 'owner';
  const canSelect = permission === 'owner' && Boolean(onToggleSelect);
  const hasSize = typeof item.size === 'number';

  function handleClick() {
    if (activeContextMenu) return;
    if (selectionMode) {
      if (canSelect) onToggleSelect(item);
      return;
    }
    handleRowClick('directory', item.id);
  }

  return (
    <div
      className={`group relative flex items-center gap-3.5 pl-3.5 pr-2 py-3.5 sm:p-4 min-h-[72px] rounded-2xl border bg-surface shadow-card cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-card-hover hover:border-border-strong active:scale-[0.99] ${
        isSelected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-border'
      }`}
      onClick={handleClick}
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      {canSelect && (
        <span
          className={`absolute top-0 left-0 z-10 p-2.5 transition-opacity duration-150 focus-within:opacity-100 pointer-coarse:opacity-100 ${
            selectionMode || isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item);
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="app-checkbox bg-surface"
            aria-label={`Select ${item.name}`}
          />
        </span>
      )}

      <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-amber-400/25 to-amber-500/10 ring-1 ring-amber-400/20 flex items-center justify-center flex-shrink-0">
        <FaFolder className="text-amber-400 text-2xl" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-[15px] font-semibold text-text truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          Folder{hasSize ? ` • ${formatSize(item.size)}` : ''}
        </p>
      </div>

      <div
        className="flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-full text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handleContextMenu(e, item.id)}
        role="button"
        aria-label={`Actions for ${item.name}`}
      >
        <BsThreeDotsVertical size={17} />
      </div>

      {activeContextMenu === item.id && (
        <ContextMenu
          item={item}
          contextMenuPos={contextMenuPos}
          isUploadingItem={false}
          handleCancelUpload={() => {}}
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

export default DirectoryGridItem;