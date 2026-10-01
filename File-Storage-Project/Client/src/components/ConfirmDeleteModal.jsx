function ConfirmDeleteModal({ item, onConfirm, onCancel, permanent = false }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {permanent ? 'Delete Forever' : 'Move to Trash'}
        </h2>
        <p className="text-sm mb-2">
          {permanent ? (
            <>
              Are you sure you want to permanently delete "{item.name}"?
            </>
          ) : (
            <>
              Move "{item.name}" {item.isDirectory ? 'folder' : 'file'} to Trash?
            </>
          )}
        </p>
        <p className="text-xs text-text-muted mb-6">
          {permanent
            ? 'This cannot be undone.'
            : 'You can restore it from Trash later.'}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => onConfirm(item)}
          >
            {permanent ? 'Delete Forever' : 'Move to Trash'}
          </button>
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;