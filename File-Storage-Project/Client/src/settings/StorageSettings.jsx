import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FaTrash } from 'react-icons/fa';
import { getStorageSummary } from '../apis/storageApi';
import { formatSize } from '../components/DetailsPopup';
import { BASE_URL } from '../Register';
import { getFileUrl } from '../apis/fileApi';
import { SettingsSection, SettingsRow, Notice, secondaryBtn } from './SettingsUI';

function Skeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4" aria-hidden="true">
      <div className="h-40 rounded-xl border border-border bg-surface-muted/60" />
      <div className="h-56 rounded-xl border border-border bg-surface-muted/40" />
    </div>
  );
}

function StorageSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getStorageSummary());
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load storage details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Skeleton />;
  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Notice>{error}</Notice>
        <button className={secondaryBtn} onClick={load}>Retry</button>
      </div>
    );
  }

  const { used, max, trashedBytes, trashedCount, fileCount, largeFiles } = data;
  const percent = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const remaining = Math.max(max - used, 0);
  const nearFull = percent >= 90;

  return (
    <>
      <SettingsSection title="Storage">
        <div className="py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-lg font-semibold text-text">
              {formatSize(used)}{' '}
              <span className="text-sm font-normal text-text-muted">of {formatSize(max)} used</span>
            </p>
            <span className="text-sm font-semibold text-text-muted">
              {used > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`}
            </span>
          </div>
          <div
            className="mt-3 h-2 rounded-full bg-surface-muted overflow-hidden"
            role="progressbar"
            aria-label="Storage used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${nearFull ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${used > 0 ? Math.max(percent, 1) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-text-muted">{formatSize(remaining)} remaining</p>
          {nearFull && (
            <p className="mt-2 text-[13px] text-danger font-medium">
              You're almost out of space. Delete large files or empty Trash to free some up.
            </p>
          )}
        </div>
        <SettingsRow label="Files">{fileCount}</SettingsRow>
        <SettingsRow label="In Trash" hint="Trashed items still count toward your storage.">
          <div className="flex flex-wrap items-center gap-3">
            <span>{formatSize(trashedBytes)} · {trashedCount} {trashedCount === 1 ? 'file' : 'files'}</span>
            <Link to="/trash" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
              <FaTrash size={11} /> Open Trash
            </Link>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Largest files" description="Your biggest files outside Trash — a good place to start cleaning up.">
        {largeFiles.length === 0 ? (
          <p className="py-6 text-sm text-text-muted">No files yet. Upload something from My Drive and it will show up here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {largeFiles.map((f) => (
              <li key={f._id} className="flex items-center gap-3 py-3">
                <a
                  href={`${BASE_URL}${getFileUrl(f._id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-text hover:text-primary"
                  title={f.name}
                >
                  {f.name}
                </a>
                <span className="text-[13px] text-text-muted flex-shrink-0">{formatSize(f.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>

      <p className="text-xs text-text-muted">
        Need more space? Plans and upgrades aren't available yet — there's no payment system in StorageApp.
      </p>
    </>
  );
}

export default StorageSettings;