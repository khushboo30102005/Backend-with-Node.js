import { useEffect, useState } from 'react';
import { FaFolder, FaChevronRight } from 'react-icons/fa';
import { getDirectoryItems } from '../apis/directoryApi';

function MoveModal({ items, onConfirm, onCancel }) {
  const [currentId, setCurrentId] = useState(''); // '' = root
  const [dir, setDir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moving, setMoving] = useState(false);

  // A folder can't be moved into itself, so hide it from navigation
  const movingIds = new Set(
    items.filter((i) => i.isDirectory).map((i) => String(i.id)),
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDirectoryItems(currentId)
      .then((d) => !cancelled && setDir(d))
      .catch(
        (e) =>
          !cancelled &&
          setError(e.response?.data?.error || 'Could not load folders.'),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const folders = (dir?.directories || []).filter(
    (d) => !movingIds.has(String(d.id)),
  );

  async function handleMove() {
    if (!dir) return;
    setMoving(true);
    await onConfirm(String(dir._id));
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center z-[999] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full max-w-md flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-base font-bold text-text">
            Move {items.length} {items.length === 1 ? 'item' : 'items'}
          </h2>
          <div className="flex items-center flex-wrap gap-1 mt-2 text-xs text-text-muted">
            {(dir?.breadcrumb || []).map((c, i, arr) => (
              <span key={c.id} className="flex items-center gap-1">
                <button
                  className="hover:text-primary disabled:text-text disabled:font-semibold"
                  disabled={i === arr.length - 1}
                  onClick={() => setCurrentId(c.id)}
                >
                  {c.name}
                </button>
                {i < arr.length - 1 && <FaChevronRight size={8} />}
              </span>
            ))}
          </div>
        </div>

        <div className="px-3 flex-1 overflow-y-auto min-h-[160px]">
          {loading ? (
            <p className="text-sm text-text-muted text-center py-8">
              Loading...
            </p>
          ) : error ? (
            <p className="text-sm text-danger text-center py-8">{error}</p>
          ) : folders.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No subfolders here.
            </p>
          ) : (
            folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setCurrentId(f.id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-surface-hover"
              >
                <FaFolder className="text-amber-500" />
                <span className="text-sm text-text truncate">{f.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
            disabled={!dir || loading || moving}
            onClick={handleMove}
          >
            {moving ? 'Moving...' : 'Move here'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;