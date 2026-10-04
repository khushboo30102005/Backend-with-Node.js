import { FaPlus, FaUpload } from 'react-icons/fa';

// Search now lives in the top bar (see TopBar + SearchContext), so this
// header only handles the title, subtitle and primary actions.
function DirectoryHeader({
  directoryName,
  subtitle,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
  readOnly = false,
}) {
  const baseButton =
    'flex items-center justify-center gap-2 h-12 sm:h-11 px-5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30 active:enabled:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';
  const secondaryButton = `${baseButton} bg-surface border border-border text-text shadow-card hover:enabled:bg-surface-hover hover:enabled:border-border-strong`;
  const primaryButton = `${baseButton} bg-linear-to-b from-primary-hover to-primary text-white shadow-[0_6px_18px_-6px_var(--color-primary)] hover:enabled:brightness-110`;

  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 border-b border-border pt-4 sm:pt-5 pb-5 sm:pb-6">
      <div className="min-w-0">
        <h1 className="m-0 text-[1.75rem] sm:text-4xl leading-tight font-bold tracking-tight text-text truncate">
          {directoryName}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm sm:text-base text-text-muted">{subtitle}</p>
        )}
      </div>

      {!readOnly && (
        <div className="grid grid-cols-2 sm:flex gap-2.5 w-full sm:w-auto flex-shrink-0">
          <button
            className={secondaryButton}
            title="New folder"
            onClick={onCreateFolderClick}
            disabled={disabled}
          >
            <FaPlus size={12} />
            <span>New</span>
          </button>

          <button
            className={primaryButton}
            title="Upload files"
            onClick={onUploadFilesClick}
            disabled={disabled}
          >
            <FaUpload size={12} />
            <span>Upload</span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
        </div>
      )}
    </header>
  );
}

export default DirectoryHeader;