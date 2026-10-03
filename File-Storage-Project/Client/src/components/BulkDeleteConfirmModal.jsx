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
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface text-text p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Move to Trash</h2>

        <p className="text-sm mb-2">Move {itemLabel} to Trash?</p>

        <p className="text-xs text-text-muted mb-6">
          You can restore them from Trash later.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            onClick={() => onConfirm(items)}
          >
            Yes, Delete
          </button>

          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
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