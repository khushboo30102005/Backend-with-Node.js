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
  const folders = items.filter((item) => item.isDirectory);
  const files = items.filter((item) => !item.isDirectory);

  function renderItem(item) {
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
  }

  // Only show section labels when both kinds are present — a folder-only
  // or file-only view doesn't need the extra visual noise of a heading.
  const showSectionLabels = folders.length > 0 && files.length > 0;

  return (
    <div className="flex flex-col gap-6 mt-4">
      {folders.length > 0 && (
        <section>
          {showSectionLabels && (
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 px-0.5">
              Folders
            </h2>
          )}
          <div className="flex flex-col gap-1.5">{folders.map(renderItem)}</div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          {showSectionLabels && (
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 px-0.5">
              Files
            </h2>
          )}
          <div className="flex flex-col gap-1.5">{files.map(renderItem)}</div>
        </section>
      )}
    </div>
  );
}

export default DirectoryList;