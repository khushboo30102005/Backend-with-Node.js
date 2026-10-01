function BulkDeleteConfirmModal({ items = [], onConfirm, onCancel }) {
  if (items.length === 0) return null;

  const fileCount = items.filter((item) => !item.isDirectory).length;
  const folderCount = items.filter((item) => item.isDirectory).length;

  const itemLabel = [
    folderCount > 0
      ? `${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`
      : null,
    fileCount > 0 ? `${fileCount} ${fileCount === 1 ? 'file' : 'files'}` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Move to Trash</h2>

        <p className="text-sm mb-6 text-text">Move {itemLabel} to Trash?</p>

        <p className="text-xs text-text-muted mb-6">
          You can restore them from Trash later.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            onClick={() => onConfirm(items)}
          >
            Yes, Delete
          </button>

          <button
            type="button"
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteConfirmModal;
