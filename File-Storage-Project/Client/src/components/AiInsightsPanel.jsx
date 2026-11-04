import { useCallback, useEffect, useRef, useState } from 'react';
import {
  analyzeFile,
  clearInsight,
  getAiStatus,
  getInsight,
} from '../apis/aiApi';

const POLL_MS = 2500;
const ACTIVE = ['queued', 'processing'];

// Shown inside DetailsPopup for files only (not folders, trash or temp- ids).
export default function AiInsightsPanel({ fileId, isOwner }) {
  const [status, setStatus] = useState(null); // /ai/status
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needConsent, setNeedConsent] = useState(null); // providerHost
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getInsight(fileId);
      setInsight(data);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [fileId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      const [s] = await Promise.allSettled([getAiStatus(), load()]);
      if (!alive) return;
      if (s.status === 'fulfilled') setStatus(s.value);
      setLoading(false);
    })();
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, [fileId, load]);

  // Poll while a job is running.
  useEffect(() => {
    clearTimeout(timer.current);
    if (insight && ACTIVE.includes(insight.status)) {
      timer.current = setTimeout(load, POLL_MS);
    }
    return () => clearTimeout(timer.current);
  }, [insight, load]);

  const run = async (confirmExternal = false) => {
    setError('');
    setNeedConsent(null);
    try {
      const data = await analyzeFile(fileId, { confirmExternal });
      setInsight(data);
    } catch (e) {
      if (e.code === 'EXTERNAL_CONSENT_REQUIRED') setNeedConsent(e.providerHost || 'an external AI service');
      else if (e.code === 'AI_OFFLINE') setError('AI is offline. Start the AI service and try again.');
      else setError(e.message);
    }
  };

  const clear = async () => {
    try {
      await clearInsight(fileId);
      setInsight({ status: 'none' });
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return <div className="h-16 animate-pulse rounded-lg bg-surface-muted" aria-busy="true" />;
  }
  if (status && status.enabled === false) return null;

  const offline = status && (status.reachable === false || status.modelReady === false);
  const busy = insight && ACTIVE.includes(insight.status);
  const done = insight?.status === 'done';

  return (
    <section className="rounded-xl border border-border bg-surface p-4" aria-label="AI insights">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <span aria-hidden="true" className="text-primary">✦</span> AI insights
        </h3>
        {isOwner && !busy && (
          <button
            type="button"
            onClick={() => run(false)}
            disabled={offline}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {done ? 'Re-analyze' : 'Analyze'}
          </button>
        )}
      </div>

      {offline && (
        <p className="mb-2 text-xs text-text-muted" role="status">
          {status.reachable === false
            ? 'AI is offline right now. Your documents were not sent anywhere.'
            : 'The AI model is not installed on the AI server.'}
        </p>
      )}

      {needConsent && (
        <div className="mb-3 rounded-lg border border-border bg-surface-muted p-3 text-xs text-text">
          <p className="mb-2">
            This will send the document text to <strong>{needConsent}</strong>, an external service.
            Continue?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run(true)}
              className="rounded-lg bg-primary px-3 py-1 font-medium text-white"
            >
              Send &amp; analyze
            </button>
            <button
              type="button"
              onClick={() => setNeedConsent(null)}
              className="rounded-lg border border-border px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {busy && (
        <p className="flex items-center gap-2 text-xs text-text-muted" role="status">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          {insight.status === 'queued' ? 'Waiting in queue…' : 'Reading and analyzing…'}
        </p>
      )}

      {insight?.status === 'failed' && (
        <p className="text-xs text-red-400">{insight.errorMessage || 'Analysis failed.'}</p>
      )}
      {insight?.status === 'unsupported' && (
        <p className="text-xs text-text-muted">{insight.errorMessage || 'This file type is not supported.'}</p>
      )}

      {done && (
        <div className="space-y-3">
          <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
            {insight.category}
          </span>
          <p className="text-sm leading-relaxed text-text">{insight.summary}</p>
          {insight.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {insight.tags.map((t) => (
                <li key={t} className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                  #{t}
                </li>
              ))}
            </ul>
          )}
          {insight.truncated && (
            <p className="text-xs text-text-muted">Long document: summary is based on the start and end.</p>
          )}
          {isOwner && (
            <button type="button" onClick={clear} className="text-xs text-text-muted underline hover:text-text">
              Clear AI data
            </button>
          )}
        </div>
      )}

      {!insight || insight.status === 'none' ? (
        !busy && !offline && (
          <p className="text-xs text-text-muted">
            {isOwner ? 'Analyze this file to get a summary, category and tags.' : 'Not analyzed yet.'}
          </p>
        )
      ) : null}
    </section>
  );
}
