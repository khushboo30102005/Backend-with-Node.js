import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCode, FaDownload, FaEye, FaSpinner, FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { fetchFileSignedUrl, fetchFileText, downloadFile } from '../apis/fileApi';

const KINDS = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg'],
  video: ['mp4', 'webm', 'm4v', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  pdf: ['pdf'],
  office: ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'],
  markdown: ['md', 'markdown'],
  // Source files: shown with syntax highlighting (language keyed by extension)
  code: ['json', 'xml', 'yml', 'yaml', 'js', 'jsx', 'ts', 'tsx', 'css', 'py', 'java'],
  // Web pages: rendered in a sandboxed frame, with a Source toggle
  html: ['html', 'htm'],
  // Plain text: no structure worth rendering
  text: ['txt', 'csv', 'log'],
};

const CODE_LANG = { jsx: 'javascript', js: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', yml: 'yaml', htm: 'xml', html: 'xml' };

// Wraps source text in a markdown code fence (longer than any backtick run
// inside it) so it goes through the same highlighted renderer as .md blocks.
function toFencedBlock(text, name) {
  const ext = name.split('.').pop().toLowerCase();
  const longest = Math.max(0, ...(text.match(/`+/g) || []).map((m) => m.length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}${CODE_LANG[ext] || ext}\n${text}\n${fence}`;
}

// Returns 'image' | 'video' | 'audio' | 'pdf' | 'office' | 'markdown' | 'code' | 'html' | 'text', or null when the file
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
// `source` lets other file stores (e.g. workspaces) supply their own
// getUrl / getText / download; it defaults to personal files.
function FileViewer({ fileId, name, onClose, source }) {
  const getUrl = source?.getUrl ?? fetchFileSignedUrl;
  const getText = source?.getText ?? fetchFileText;
  const download = source?.download ?? downloadFile;
  const kind = getPreviewKind(name);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Markdown, code and html are fetched as text and rendered in-app; everything else
    // loads straight from a signed storage URL.
    (kind === 'markdown' || kind === 'code' || kind === 'html' ? getText(fileId) : getUrl(fileId))
      .then((u) => !cancelled && setUrl(u || ' ')) // ' ' keeps an empty file from spinning forever
      .catch(
        (err) =>
          !cancelled &&
          setError(err.response?.data?.error || 'Could not load this file.'),
      );
    return () => {
      cancelled = true;
    };
  }, [fileId, kind]);

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
        {kind === 'html' && (
          <button
            type="button"
            onClick={() => setShowSource((v) => !v)}
            aria-label={showSource ? 'Show preview' : 'Show source'}
            title={showSource ? 'Show preview' : 'Show source'}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
          >
            {showSource ? <FaEye size={15} /> : <FaCode size={15} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => download(fileId)}
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
            if (kind === 'html' && !showSource)
              // Uploaded HTML is untrusted: it runs in an opaque-origin
              // sandbox (scripts allowed, but no same-origin) so it can never
              // reach this app's cookies, storage or API.
              return (
                <iframe
                  srcDoc={url}
                  title={name}
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  onClick={stop}
                  className="w-full h-full rounded-lg bg-white"
                />
              );
            if (kind === 'markdown' || kind === 'code' || kind === 'html')
              return (
                <div
                  onClick={stop}
                  className="w-full h-full max-w-3xl overflow-y-auto rounded-lg bg-surface px-5 sm:px-8 py-6 text-text"
                >
                  <div className="md-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeHighlight, { detect: false }]]}
                    >
                      {kind === 'code' || kind === 'html' ? toFencedBlock(url, name) : url}
                    </ReactMarkdown>
                  </div>
                </div>
              );
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
            // Office files render through Microsoft's hosted viewer, which
            // fetches the (short-lived, signed) file URL itself.
            const src =
              kind === 'office'
                ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
                : url;
            return (
              <iframe
                src={src}
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