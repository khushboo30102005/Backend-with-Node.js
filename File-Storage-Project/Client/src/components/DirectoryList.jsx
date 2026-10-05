import { FaFolderOpen, FaRegFileAlt, FaChevronDown } from 'react-icons/fa';
import DirectoryItem from './DirectoryItem';
import DirectoryGridItem from './DirectoryGridItem';
import SelectAllCheckbox from './SelectAllCheckbox';
import { getItemKey } from '../utils/itemKey';

function SectionHeader({ icon: Icon, title, count, singular, plural }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-text">
        <Icon size={15} className="text-text-muted" />
        {title}
      </h2>
      <span className="text-xs text-text-muted">
        {count} {count === 1 ? singular : plural}
      </span>
    </div>
  );
}

// Decorative until column sorting is built
function SortHint() {
  return (
    <span aria-hidden="true" className="text-text-muted/60">
      <FaChevronDown size={9} />
    </span>
  );
}

function DirectoryList({
  items,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  closeContextMenu,
  getFileIcon,
  isUploading,
  progressMap,
  handleCancelUpload,
  openRenameModal,
  openDeleteConfirm,
  openDetailsPopup,
  openMoveModal,
  openShareModal,
  onRestore,
  openPermanentDeleteConfirm,
  apiBase,
  selectedKeys,
  onToggleSelect,
  selectionMode = false,
  selectedCount = 0,
  allSelected = false,
  onSelectAll,
}) {
  const folders = items.filter((item) => item.isDirectory);
  const files = items.filter((item) => !item.isDirectory);
  const selectable = Boolean(onToggleSelect);
  const showSelectColumn = selectable && selectionMode;

  function isSelected(item) {
    return selectedKeys ? selectedKeys.has(getItemKey(item)) : false;
  }

  return (
    <div className="flex flex-col gap-5 mt-4">
      {folders.length > 0 && (
        <section>
          <SectionHeader
            icon={FaFolderOpen}
            title="Folders"
            count={folders.length}
            singular="folder"
            plural="folders"
          />
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-3">
            {folders.map((item) => (
              <DirectoryGridItem
                key={item.id}
                item={item}
                handleRowClick={handleRowClick}
                activeContextMenu={activeContextMenu}
                contextMenuPos={contextMenuPos}
                handleContextMenu={handleContextMenu}
                closeContextMenu={closeContextMenu}
                openRenameModal={openRenameModal}
                openDeleteConfirm={openDeleteConfirm}
                openDetailsPopup={openDetailsPopup}
                openMoveModal={openMoveModal}
                openShareModal={openShareModal}
                onRestore={onRestore}
                openPermanentDeleteConfirm={openPermanentDeleteConfirm}
                apiBase={apiBase}
                isSelected={isSelected(item)}
                onToggleSelect={onToggleSelect}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <SectionHeader
            icon={FaRegFileAlt}
            title="Files"
            count={files.length}
            singular="file"
            plural="files"
          />
          <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
            {/* Column header (≥ 640px) */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-surface-muted/60 border-b border-border text-xs font-semibold text-text-muted">
              {showSelectColumn && (
                <span className="flex items-center justify-center w-8 flex-shrink-0">
                  <SelectAllCheckbox
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    onChange={onSelectAll}
                    label="Select all"
                  />
                </span>
              )}
              <span className="w-9 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 min-w-0 flex items-center gap-1.5">
                Name <SortHint />
              </span>
              <span className="w-24 flex-shrink-0 flex items-center gap-1.5">
                Size <SortHint />
              </span>
              <span className="w-28 flex-shrink-0 flex items-center gap-1.5">
                Modified <SortHint />
              </span>
              <span className="w-16 flex-shrink-0 text-center">Actions</span>
            </div>

            <div className="divide-y divide-border">
              {files.map((item) => {
                const uploadProgress = progressMap[item.id] || 0;
                return (
                  <DirectoryItem
                    key={item.id}
                    item={item}
                    handleRowClick={handleRowClick}
                    activeContextMenu={activeContextMenu}
                    contextMenuPos={contextMenuPos}
                    handleContextMenu={handleContextMenu}
                    closeContextMenu={closeContextMenu}
                    getFileIcon={getFileIcon}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    handleCancelUpload={handleCancelUpload}
                    openRenameModal={openRenameModal}
                    openMoveModal={openMoveModal}
                    openDeleteConfirm={openDeleteConfirm}
                    openDetailsPopup={openDetailsPopup}
                    openShareModal={openShareModal}
                    onRestore={onRestore}
                    openPermanentDeleteConfirm={openPermanentDeleteConfirm}
                    apiBase={apiBase}
                    isSelected={isSelected(item)}
                    onToggleSelect={onToggleSelect}
                    selectionMode={selectionMode}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default DirectoryList;