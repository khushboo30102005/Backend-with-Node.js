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
  const showCheckbox = selectionMode && Boolean(onToggleSelect);
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
      className={`group relative flex items-center gap-3 pl-3 pr-1.5 py-2.5 min-h-[64px] rounded-xl border bg-surface shadow-card cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:border-border-strong active:scale-[0.99] ${
        isSelected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-border'
      }`}
      onClick={handleClick}
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      {showCheckbox && (
        <span
          className="flex items-center justify-center flex-shrink-0 w-8 h-8 -ml-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (canSelect) onToggleSelect(item);
          }}
        >
          {canSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="app-checkbox bg-surface"
              aria-label={`Select ${item.name}`}
            />
          )}
        </span>
      )}

      <span className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-400/25 to-amber-500/10 ring-1 ring-amber-400/20 flex items-center justify-center flex-shrink-0">
        <FaFolder className="text-amber-400 text-xl" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold text-text truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          Folder{hasSize ? ` • ${formatSize(item.size)}` : ''}
        </p>
      </div>

      <div
        className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full text-text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-text"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => handleContextMenu(e, item.id)}
        role="button"
        aria-label={`Actions for ${item.name}`}
      >
        <BsThreeDotsVertical size={16} />
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