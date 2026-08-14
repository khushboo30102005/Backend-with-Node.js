import { useEffect, useRef } from 'react';

function CreateDirectoryModal({
  newDirname,
  setNewDirname,
  onClose,
  onCreateDirectory,
  error,
}) {
  const inputRef = useRef(null);

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
          Create a new directory
        </h2>
        <form className="flex flex-col gap-2" onSubmit={onCreateDirectory}>
          <input
            ref={inputRef}
            type="text"
            className="px-3 py-2.5 border border-border rounded-lg text-sm transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12"
            placeholder="Enter folder name"
            value={newDirname}
            onChange={(e) => setNewDirname(e.target.value)}
          />
          {error && <p className="text-danger text-[13px] -mt-1 mb-0">{error}</p>}
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              className="px-4 py-2.5 rounded-lg border-none bg-primary text-white font-semibold text-sm cursor-pointer hover:bg-primary-hover transition-colors"
              type="submit"
            >
              Create
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

export default CreateDirectoryModal;