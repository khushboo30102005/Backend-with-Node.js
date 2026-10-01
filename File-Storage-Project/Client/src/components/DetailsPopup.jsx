import { useEffect, useState } from 'react';
import { FaFolder, FaFileAlt, FaClock, FaHdd, FaUserCircle, FaTimes } from 'react-icons/fa';

export const formatSize = (bytes = 0) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + ' GB';
  if (bytes >= MB) return (bytes / MB).toFixed(2) + ' MB';
  if (bytes >= KB) return (bytes / KB).toFixed(2) + ' KB';
  return bytes + ' B';
};

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-text text-right break-words">{value}</span>
    </div>
  );
}

function DetailsPopup({ item, breadcrumb = [], onClose }) {
  const [details] = useState({
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

  const { name, isDirectory, size, createdAt, updatedAt, sharedBy } = item;
  const { numberOfFiles, numberOfFolders } = details;

  const path =
    breadcrumb.length > 0
      ? `${breadcrumb.map((b) => b.name).join(' / ')} / ${name}`
      : name;

  // "Shared with me" items carry `sharedBy` — for those, show a trimmed
  // view (Shared by / Path / Size only). Own Drive items never set this,
  // so they keep the full detail set unchanged.
  const isSharedItem = Boolean(sharedBy);

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <span
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDirectory ? 'bg-amber-50' : 'bg-indigo-50'
            }`}
          >
            {isDirectory ? (
              <FaFolder className="text-amber-500 text-lg" />
            ) : (
              <FaFileAlt className="text-primary text-lg" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-base font-bold text-text truncate" title={name}>
              {name}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isDirectory ? 'Folder details' : 'File details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 -mr-1 -mt-1"
            title="Close"
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Details */}
        <div className="px-6">
          {isSharedItem && (
            <DetailRow
              label="Shared by"
              value={
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <FaUserCircle size={12} className="text-text-muted flex-shrink-0" />
                  {sharedBy.name}
                </span>
              }
            />
          )}

          <DetailRow label="Path" value={<span className="break-all">{path}</span>} />
          <DetailRow
            label="Size"
            value={
              <span className="inline-flex items-center gap-1.5">
                <FaHdd size={11} className="text-text-muted" />
                {formatSize(size)}
              </span>
            }
          />

          {!isSharedItem && (
            <>
              <DetailRow
                label="Created"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <FaClock size={11} className="text-text-muted" />
                    {createdAt ? new Date(createdAt).toLocaleString() : '—'}
                  </span>
                }
              />
              <DetailRow
                label="Updated"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <FaClock size={11} className="text-text-muted" />
                    {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}
                  </span>
                }
              />
              {isDirectory && (
                <>
                  <DetailRow label="Files" value={numberOfFiles} />
                  <DetailRow label="Folders" value={numberOfFolders} />
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 mt-2 border-t border-gray-100 bg-gray-50/50">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition-colors"
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