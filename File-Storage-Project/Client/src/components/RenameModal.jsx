import { useEffect, useRef, useState } from 'react';
import { splitFileName } from '../utils/fileName';

function RenameModal({
  renameType,
  renameValue,
  setRenameValue,
  onClose,
  onRenameSubmit,
  error,
  extension,
}) {
  const inputRef = useRef(null);
  const isFile = renameType === 'file';
  // A file's extension can't be changed: only the name before it is editable,
  // and the original extension is always sent back with it.
  const [fileExt] = useState(() =>
    isFile ? splitFileName(renameValue, extension).ext : '',
  );
  const inputValue =
    fileExt && renameValue.endsWith(fileExt)
      ? renameValue.slice(0, -fileExt.length)
      : renameValue;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-black/45 backdrop-blur-[2px] flex justify-center items-center z-[999]"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-surface p-6 w-[90%] max-w-[400px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
        onClick={handleContentClick}
      >
        <h2 className="mt-0 mb-3 text-lg font-bold text-text">
          Rename {renameType === 'file' ? 'File' : 'Folder'}
        </h2>
        <form className="flex flex-col gap-2" onSubmit={onRenameSubmit}>
          <div className="flex items-stretch gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 min-w-0 px-3 py-2.5 border border-border rounded-lg text-sm bg-surface text-text transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
              placeholder="Enter new name"
              aria-label={fileExt ? 'File name (without extension)' : 'New name'}
              value={inputValue}
              onChange={(e) => setRenameValue(e.target.value + fileExt)}
            />
            {fileExt && (
              <span
                className="flex items-center px-3 border border-border rounded-lg text-sm text-text-muted bg-surface-muted select-none"
                title="The file extension can't be changed"
              >
                {fileExt}
              </span>
            )}
          </div>
          {error && (
            <p className="text-danger text-[13px] -mt-1 mb-0">{error}</p>
          )}
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              className="px-4 py-2.5 rounded-lg border-none bg-primary text-white font-semibold text-sm cursor-pointer hover:bg-primary-hover transition-colors"
              type="submit"
            >
              Save
            </button>
            <button
              className="px-[15px] py-2 rounded-lg bg-gray-200 text-gray-700 border-none cursor-pointer hover:bg-gray-400 transition-colors"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;