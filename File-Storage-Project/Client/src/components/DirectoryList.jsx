import DirectoryItem from './DirectoryItem';
import DirectoryGridItem from './DirectoryGridItem';
import { getItemKey } from "../utils/itemKey";

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
}) {
  const folders = items.filter((item) => item.isDirectory);
  const files = items.filter((item) => !item.isDirectory);

  function isSelected(item) {
    return selectedKeys ? selectedKeys.has(getItemKey(item)) : false;
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      {folders.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 px-0.5">
            Folders
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
          <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 px-0.5">
            Files
          </h2>
          <div className="flex flex-col gap-1.5">
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
        </section>
      )}
    </div>
  );
}

export default DirectoryList;