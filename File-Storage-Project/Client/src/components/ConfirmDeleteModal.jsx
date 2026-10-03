function ConfirmDeleteModal({ item, onConfirm, onCancel, permanent = false }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface text-text p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">
          {permanent ? 'Delete Forever' : 'Move to Trash'}
        </h2>
        <p className="text-sm mb-2">
          {permanent ? (
            <>Are you sure you want to permanently delete "{item.name}"?</>
          ) : (
            <>
              Move "{item.name}" {item.isDirectory ? 'folder' : 'file'} to
              Trash?
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
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            onClick={() => onConfirm(item)}
          >
            {permanent ? 'Delete Forever' : 'Move to Trash'}
          </button>
          <button
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

export default ConfirmDeleteModal;