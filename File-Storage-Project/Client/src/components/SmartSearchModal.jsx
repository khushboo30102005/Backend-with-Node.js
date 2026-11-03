import { useEffect, useRef, useState } from 'react';
import { smartSearch } from '../apis/aiApi';
import FileViewer from './FileViewer';

// Opens the existing FileViewer for a result. While the viewer is open the
// overlay is hidden so the z-[100] viewer is not covered by this z-[999] modal.
export default function SmartSearchModal({ onClose }) {
  const [viewerFile, setViewerFile] = useState(null);
  const viewerOpen = Boolean(viewerFile);
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ phase: 'idle' }); // idle|loading|done|error|consent
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !viewerOpen && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, viewerOpen]);

  const run = async (confirmExternal = false) => {
    const q = query.trim();
    if (q.length < 3) {
      setState({ phase: 'error', message: 'Type at least 3 characters.' });
      return;
    }
    setState({ phase: 'loading' });
    try {
      const data = await smartSearch(q, { confirmExternal });
      setState({ phase: 'done', ...data });
    } catch (e) {
      if (e.code === 'EXTERNAL_CONSENT_REQUIRED') {
        setState({ phase: 'consent', host: e.providerHost });
      } else if (e.code === 'AI_OFFLINE' || e.code === 'AI_DISABLED') {
        setState({ phase: 'error', message: 'AI search is offline right now. Nothing was sent anywhere.' });
      } else {
        setState({ phase: 'error', message: e.message });
      }
    }
  };

  if (viewerOpen) {
    return (
      <FileViewer
        fileId={viewerFile.id}
        name={viewerFile.name}
        onClose={() => setViewerFile(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/60 p-4 pt-[10vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Smart search"
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(false);
          }}
          className="flex items-center gap-2 border-b border-border p-3"
        >
          <span aria-hidden="true" className="text-primary">✦</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={300}
            placeholder="Describe what you’re looking for…"
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
          <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
            Search
          </button>
          <button type="button" onClick={onClose} className="px-2 text-text-muted hover:text-text" aria-label="Close">
            ✕
          </button>
        </form>

        <div className="overflow-y-auto p-3">
          {state.phase === 'idle' && (
            <p className="p-4 text-center text-sm text-text-muted">
              Try “invoice from last month” or “my resume”. Only analyzed files are searched.
            </p>
          )}
          {state.phase === 'loading' && <p className="p-4 text-center text-sm text-text-muted">Searching…</p>}
          {state.phase === 'error' && (
            <p className="p-4 text-center text-sm text-red-400" role="alert">{state.message}</p>
          )}
          {state.phase === 'consent' && (
            <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-text">
              <p className="mb-3">
                Your search text will be sent to <strong>{state.host || 'an external AI service'}</strong>. Continue?
              </p>
              <button
                type="button"
                onClick={() => run(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
              >
                Send &amp; search
              </button>
            </div>
          )}
          {state.phase === 'done' && (
            <>
              {state.analyzedCount === 0 && (
                <p className="p-4 text-center text-sm text-text-muted">
                  No files analyzed yet. Open a file’s details and press Analyze.
                </p>
              )}
              {state.analyzedCount > 0 && state.results.length === 0 && (
                <p className="p-4 text-center text-sm text-text-muted">No matching files.</p>
              )}
              {state.staleCount > 0 && (
                <p className="mb-2 text-xs text-text-muted">
                  {state.staleCount} file(s) were analyzed with a different AI model and are skipped. Re-analyze them.
                </p>
              )}
              <ul className="space-y-2">
                {state.results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setViewerFile(r)}
                      className="w-full rounded-xl border border-border bg-surface p-3 text-left hover:bg-surface-muted"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-text">{r.name}</span>
                        <span className="shrink-0 text-xs text-text-muted">{Math.round(r.score * 100)}%</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">{r.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] capitalize text-primary">
                          {r.category}
                        </span>
                        {r.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] text-text-muted">
                            #{t}
                          </span>
                        ))}
                        {r.sharedBy && (
                          <span className="ml-auto text-[11px] text-text-muted">Shared by {r.sharedBy.name}</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
