import { useEffect, useState } from 'react';

function DetailsPopup({ item, onClose }) {
  const [details, setDetails] = useState({
    path: '/',
    size: 0,
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
    numberOfFiles: 0,
    numberOfFolders: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!item) return null;

  const { name, isDirectory } = item;
  const { path, size, createdAt, updatedAt, numberOfFiles, numberOfFolders } =
    details;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {name}
          </div>
          <div>
            <span className="font-semibold">Path:</span> {path}
          </div>
          <div>
            <span className="font-semibold">Size:</span> {size}
          </div>
          <div>
            <span className="font-semibold">Created At:</span> {createdAt}
          </div>
          <div>
            <span className="font-semibold">Updated At:</span> {updatedAt}
          </div>
          {isDirectory && (
            <>
              <div>
                <span className="font-semibold">Files:</span> {numberOfFiles}
              </div>
              <div>
                <span className="font-semibold">Folders:</span>{' '}
                {numberOfFolders}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPopup;