import { useEffect, useState } from 'react';
import { getDirectoryItems as fetchDirectoryItems } from '../apis/directoryApi';

export const formatSize = (bytes = 0) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + ' GB';
  if (bytes >= MB) return (bytes / MB).toFixed(2) + ' MB';
  if (bytes >= KB) return (bytes / KB).toFixed(2) + ' KB';
  return bytes + ' B';
};

function DetailsPopup({ item, breadcrumb = [], apiBase = '', onClose }) {
  const [numberOfFiles, setNumberOfFiles] = useState(0);
  const [numberOfFolders, setNumberOfFolders] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!item?.isDirectory) return;

    async function loadDirectoryDetails() {
      try {
        setLoadingCounts(true);

        const data = await fetchDirectoryItems(item.id, apiBase);

        setNumberOfFiles(data.files?.length || 0);
        setNumberOfFolders(data.directories?.length || 0);
      } catch (error) {
        console.error('Failed to fetch directory details:', error);

        setNumberOfFiles(0);
        setNumberOfFolders(0);
      } finally {
        setLoadingCounts(false);
      }
    }

    loadDirectoryDetails();
  }, [item, apiBase]);

  if (!item) return null;

  const { name, isDirectory, size, createdAt, updatedAt } = item;

  const path =
    breadcrumb.length > 0
      ? `${breadcrumb.map((b) => b.name).join(' / ')} / ${name}`
      : name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isDirectory ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H14a1 1 0 0 1-1-1V3.5ZM7 13h10v1H7v-1Zm0 3h10v1H7v-1Zm0-6h4v1H7v-1Z" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              <p className="max-w-[300px] truncate text-sm text-gray-500">
                {name}
              </p>
            </div>
          </div>

          {/* Close icon */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            {/* Name */}
            <div className="flex gap-4 border-b border-gray-100 px-4 py-4">
              <div className="w-28 shrink-0 text-sm font-medium text-gray-500">
                Name
              </div>

              <div className="min-w-0 text-sm font-medium text-gray-900 break-words">
                {name}
              </div>
            </div>

            {/* Path */}
            <div className="flex gap-4 border-b border-gray-100 px-4 py-4">
              <div className="w-28 shrink-0 text-sm font-medium text-gray-500">
                Location
              </div>

              <div
                className="min-w-0 text-sm leading-6 text-gray-700 break-words"
                title={path}
              >
                {path}
              </div>
            </div>

            {/* Size */}
            <div className="flex gap-4 border-b border-gray-100 px-4 py-4">
              <div className="w-28 shrink-0 text-sm font-medium text-gray-500">
                Size
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {formatSize(size)}
              </div>
            </div>

            {/* Created */}
            <div className="flex gap-4 border-b border-gray-100 px-4 py-4">
              <div className="w-28 shrink-0 text-sm font-medium text-gray-500">
                Created
              </div>

              <div className="text-sm text-gray-700">
                {new Date(createdAt).toLocaleString()}
              </div>
            </div>

            {/* Updated */}
            <div className="flex gap-4 px-4 py-4">
              <div className="w-28 shrink-0 text-sm font-medium text-gray-500">
                Modified
              </div>

              <div className="text-sm text-gray-700">
                {new Date(updatedAt).toLocaleString()}
              </div>
            </div>

            {/* Folder information */}
            {isDirectory && (
              <div className="grid grid-cols-2 border-t border-gray-200">
                <div className="border-r border-gray-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Files
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {numberOfFiles}
                  </p>
                </div>

                <div className="px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Folders
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {numberOfFolders}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPopup;
