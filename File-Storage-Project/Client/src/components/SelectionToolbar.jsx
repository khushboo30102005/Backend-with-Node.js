import { FaTrash, FaTimes, FaArrowsAlt } from 'react-icons/fa';

function SelectionToolbar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClearSelection,
  onDelete,
  onMove,
  readOnly = false,
}) {
  if (readOnly || selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 mt-4 px-4 py-3 bg-surface border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-text whitespace-nowrap">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>

        {totalCount > 0 && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClearSelection}
          title="Clear selection"
          className="flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-gray-100 hover:text-text transition-colors cursor-pointer"
        >
          <FaTimes size={13} />
        </button>

        <button
          type="button"
          onClick={onMove}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-border text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
        >
          <FaArrowsAlt size={12} />
          Move
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
        >
          <FaTrash size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}

export default SelectionToolbar;