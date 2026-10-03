import { FaPlus, FaUpload, FaSearch } from 'react-icons/fa';

function DirectoryHeader({
  directoryName,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
  readOnly = false,
  searchValue = '',
  onSearchChange,
}) {
  const actionButtonClass =
    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold  border border-border text-text cursor-pointer transition-all duration-150 hover:enabled:bg-surface-hover hover:enabled:border-gray-300 hover:enabled:scale-[1.03] active:enabled:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <header className="flex flex-col gap-3 border-b border-border py-4 ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[1.5rem] font-bold tracking-tight text-text truncate max-w-[45vw]">
          {directoryName}
        </h1>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={actionButtonClass}
              title="New folder"
              onClick={onCreateFolderClick}
              disabled={disabled}
            >
              <FaPlus size={12} />
              <span>New</span>
            </button>

            <button
              className={actionButtonClass}
              title="Upload files"
              onClick={onUploadFilesClick}
              disabled={disabled}
            >
              <FaUpload size={12} />
              <span className="hidden sm:inline">Upload</span>
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
      </div>

      {onSearchChange && (
        <div className="relative w-full sm:max-w-[320px]">
          <FaSearch
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files and folders..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm  text-text transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
          />
        </div>
      )}
    </header>
  );
}

export default DirectoryHeader;