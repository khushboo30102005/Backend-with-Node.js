import { FaFolder } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import ContextMenu from '../components/ContextMenu';

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
  const canSelect = permission === 'owner';

  return (
    <div
      className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-surface cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-gray-300 active:scale-[0.97]"
      onClick={() => (!activeContextMenu ? handleRowClick('directory', item.id) : null)}
      onContextMenu={(e) => handleContextMenu(e, item.id)}
    >
      {canSelect && selectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item)}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 w-4 h-4 cursor-pointer accent-primary z-10"
          aria-label={`Select ${item.name}`}
        />
      )}

      <div
        className="absolute top-1.5 right-1.5 flex items-center justify-center text-text-muted rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-gray-100 hover:text-text"
        onClick={(e) => handleContextMenu(e, item.id)}
      >
        <BsThreeDotsVertical size={14} />
      </div>

      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
        <FaFolder className="text-amber-500 text-xl" />
      </div>

      <span
        className="text-xs font-medium text-text text-center truncate w-full"
        title={item.name}
      >
        {item.name}
      </span>

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