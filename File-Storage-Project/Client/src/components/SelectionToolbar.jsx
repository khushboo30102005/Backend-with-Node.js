import { createPortal } from 'react-dom';
import {
  FaTrash,
  FaTimes,
  FaArrowsAlt,
  FaDownload,
  FaShareAlt,
  FaRegCheckSquare,
} from 'react-icons/fa';
import SelectAllCheckbox from './SelectAllCheckbox';

const baseBtn =
  'inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed';
const neutralBtn = `${baseBtn} bg-surface border-border text-text hover:enabled:bg-surface-hover hover:enabled:border-border-strong`;
const dangerBtn = `${baseBtn} bg-danger/10 border-danger/30 text-danger hover:enabled:bg-danger hover:enabled:text-white hover:enabled:border-danger`;

// The ONLY selection control on the page.
//   inactive: a single "Select" button
//   active:   Cancel · select-all · "N selected" · Download Move Share Delete
// Download and Share act on the selected FILES (folders are skipped).
function SelectionToolbar({
  selectionMode,
  onEnter,
  onCancel,
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onDelete,
  onMove,
  onDownload,
  onShare,
  canDownload = false, // at least one file selected
  canShare = false,
}) {
  if (totalCount === 0 && !selectionMode) return null;

  if (!selectionMode) {
    return (
      <button
        type="button"
        onClick={onEnter}
        className={`${neutralBtn} ml-auto`}
      >
        <FaRegCheckSquare size={13} />
        Select
      </button>
    );
  }

  const hasSelection = selectedCount > 0;

  return (
    <>
      <div className="flex-1 min-w-0 basis-[560px] flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-2 py-1.5 animate-fade-in">
        <button
          type="button"
          onClick={onCancel}
          className={`${neutralBtn} h-8`}
        >
          <FaTimes size={11} />
          Cancel
        </button>

        <label className="flex items-center gap-2.5 pl-1.5 pr-2 min-w-0 cursor-pointer">
          <SelectAllCheckbox
            checked={allSelected}
            indeterminate={hasSelection && !allSelected}
            onChange={onSelectAll}
            label={allSelected ? 'Deselect all' : 'Select all'}
          />
          <span
            className={`text-[13px] font-semibold whitespace-nowrap ${
              hasSelection ? 'text-primary' : 'text-text-muted'
            }`}
          >
            {hasSelection ? `${selectedCount} selected` : 'Select all'}
          </span>
        </label>

        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onDownload}
            disabled={!canDownload}
            title={hasSelection && !canDownload ? 'Folders can\u2019t be downloaded' : undefined}
            className={`${neutralBtn} h-8`}
          >
            <FaDownload size={12} />
            Download
          </button>
          <button
            type="button"
            onClick={onMove}
            disabled={!hasSelection}
            className={`${neutralBtn} h-8`}
          >
            <FaArrowsAlt size={12} />
            Move
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={!canShare}
            title={hasSelection && !canShare ? 'Folders can\u2019t be shared' : undefined}
            className={`${neutralBtn} h-8`}
          >
            <FaShareAlt size={12} />
            Share
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!hasSelection}
            className={`${dangerBtn} h-8`}
          >
            <FaTrash size={11} />
            Delete
          </button>
        </div>
      </div>

      {/* Phones: floating bottom action bar, within thumb reach */}
      {hasSelection &&
        createPortal(
          <div className="sm:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-2 p-2 rounded-2xl border border-primary/30 bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.35)] animate-fade-in">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel selection"
              className="flex items-center justify-center w-11 h-11 rounded-xl text-text-muted hover:bg-surface-muted transition-colors flex-shrink-0"
            >
              <FaTimes size={15} />
            </button>
            <span className="flex-1 min-w-0 text-sm font-semibold text-primary truncate">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onDownload}
              disabled={!canDownload}
              aria-label="Download"
              className={`${neutralBtn} h-11 w-11 px-0`}
            >
              <FaDownload size={13} />
            </button>
            <button
              type="button"
              onClick={onShare}
              disabled={!canShare}
              aria-label="Share"
              className={`${neutralBtn} h-11 w-11 px-0`}
            >
              <FaShareAlt size={13} />
            </button>
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