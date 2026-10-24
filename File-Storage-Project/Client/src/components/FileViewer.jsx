import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaDownload, FaSpinner, FaTimes } from 'react-icons/fa';
import { fetchFileSignedUrl, downloadFile } from '../apis/fileApi';

const KINDS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg'],
  video: ['mp4', 'webm', 'm4v', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  pdf: ['pdf'],
  text: ['txt', 'md', 'json', 'csv', 'log', 'xml', 'yml', 'yaml', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'java'],
};

// Returns 'image' | 'video' | 'audio' | 'pdf' | 'text', or null when the file
// can't be previewed in the browser (docx, zip, ...) and should be downloaded.
export function getPreviewKind(name = '') {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  return Object.keys(KINDS).find((k) => KINDS[k].includes(ext)) || null;
}

export function isImageName(name = '') {
  return getPreviewKind(name) === 'image';
}

// In-app image preview. Fetches a short-lived signed storage URL with the
// session cookie (a normal request) and shows it in a lightbox, so previewing
// never depends on a new tab / pop-up being allowed.
function FileViewer({ fileId, name, onClose }) {
  const kind = getPreviewKind(name);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchFileSignedUrl(fileId)
      .then((u) => !cancelled && setUrl(u))
      .catch(
        (err) =>
          !cancelled &&
          setError(err.response?.data?.error || 'Could not load this file.'),
      );
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name || 'File preview'}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="flex-1 min-w-0 truncate text-sm font-semibold">{name}</p>
        <button
          type="button"
          onClick={() => downloadFile(fileId)}
          aria-label="Download"
          title="Download"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
        >
          <FaDownload size={15} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        {error ? (
          <p className="text-sm text-white" onClick={(e) => e.stopPropagation()}>
            {error}
          </p>
        ) : url ? (
          (() => {
            const stop = (e) => e.stopPropagation();
            const fail = () =>
              setError('Could not display this file. Try downloading it.');
            if (kind === 'image')
              return (
                <img
                  src={url}
                  alt={name}
                  onClick={stop}
                  onError={fail}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                />
              );
            if (kind === 'video')
              return (
                <video
                  src={url}
                  controls
                  autoPlay
                  onClick={stop}
                  onError={fail}
                  className="max-w-full max-h-full rounded-lg"
                />
              );
            if (kind === 'audio')
              return (
                <audio src={url} controls autoPlay onClick={stop} onError={fail} />
              );
            return (
              <iframe
                src={url}
                title={name}
                onClick={stop}
                className="w-full h-full max-w-5xl rounded-lg bg-white"
              />
            );
          })()
        ) : (
          <FaSpinner className="animate-spin text-white" size={28} />
        )}
      </div>
    </div>,
    document.body,
  );
}

export default FileViewer;