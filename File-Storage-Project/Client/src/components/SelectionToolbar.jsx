import { createPortal } from 'react-dom';
import {
  FaTrash,
  FaTimes,
  FaArrowsAlt,
  FaDownload,
  FaShareAlt,
} from 'react-icons/fa';
import SelectAllCheckbox from './SelectAllCheckbox';

const baseBtn =
  'flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed';
const neutralBtn = `${baseBtn} bg-surface-muted/60 border-border text-text hover:enabled:bg-surface-hover hover:enabled:border-border-strong`;
const dangerBtn = `${baseBtn} bg-danger/10 border-danger/30 text-danger hover:enabled:bg-danger hover:enabled:text-white hover:enabled:border-danger`;

// Desktop/tablet: a bar at the top of the Files card.
// Phones: the inline row only shows the select-all control; once something is
// selected, the actions move to a floating bottom bar within thumb reach.
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
  if (readOnly || totalCount === 0) return null;

  const hasSelection = selectedCount > 0;

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border last:border-b-0 transition-colors ${
          hasSelection ? 'bg-primary/10' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 -ml-1 sm:ml-0">
            <SelectAllCheckbox
              checked={allSelected}
              indeterminate={hasSelection && !allSelected}
              onChange={onSelectAll}
              label={allSelected ? 'Deselect all' : 'Select all'}
            />
          </span>
          <span
            className={`text-sm font-semibold whitespace-nowrap ${
              hasSelection ? 'text-primary' : 'text-text-muted'
            }`}
          >
            {hasSelection
              ? `${selectedCount} selected`
              : 'Select'}
          </span>
          {hasSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="hidden sm:inline text-xs font-semibold text-text-muted hover:text-primary transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* ≥ 640px actions */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Prepared UI — bulk download / share aren't built yet */}
          <button
            type="button"
            disabled
            title="Bulk download is coming soon"
            className={neutralBtn}
          >
            <FaDownload size={12} />
            Download
          </button>
          <button
            type="button"
            onClick={onMove}
            disabled={!hasSelection}
            className={neutralBtn}
          >
            <FaArrowsAlt size={12} />
            Move
          </button>
          <button
            type="button"
            disabled
            title="Bulk sharing is coming soon"
            className={neutralBtn}
          >
            <FaShareAlt size={12} />
            Share
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!hasSelection}
            className={dangerBtn}
          >
            <FaTrash size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* Phones: floating bottom action bar */}
      {hasSelection &&
        createPortal(
          <div className="sm:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-2 p-2 rounded-2xl border border-primary/30 bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.35)] animate-fade-in">
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="flex items-center justify-center w-11 h-11 rounded-xl text-text-muted hover:bg-surface-muted transition-colors flex-shrink-0"
            >
              <FaTimes size={15} />
            </button>
            <span className="flex-1 min-w-0 text-sm font-semibold text-primary truncate">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onMove}
              className={`${neutralBtn} h-11`}
            >
              <FaArrowsAlt size={13} />
              Move
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={`${dangerBtn} h-11`}
            >
              <FaTrash size={13} />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}

export default SelectionToolbar;