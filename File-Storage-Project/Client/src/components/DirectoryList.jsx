import DirectoryItem from './DirectoryItem';

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
  apiBase,
  readOnly = false,
}) {
  return (
    <div className="flex flex-col gap-1.5 mt-6">
      {items.map((item) => {
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
            openDeleteConfirm={openDeleteConfirm}
            openDetailsPopup={openDetailsPopup}
            apiBase={apiBase}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

export default DirectoryList;
