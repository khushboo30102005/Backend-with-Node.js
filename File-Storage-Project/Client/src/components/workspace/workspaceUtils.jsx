import { useEffect, useState } from 'react';
import { FaCheckCircle, FaClock, FaArchive, FaBan } from 'react-icons/fa';

// Re-renders the caller every `ms` so countdowns stay live.
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function formatRemaining(ms) {
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 1) return `${d}d ${h}h left`;
  if (h >= 1) return `${h}h ${m}m left`;
  if (m >= 1) return `${m}m left`;
  return 'Less than a minute left';
}

export const formatDateTime = (d) =>
  new Date(d).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

// <input type="datetime-local"> wants local time without a zone suffix.
export function toLocalInputValue(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Display state is derived from the live clock so a card flips to
// "Expired" the moment time runs out, without waiting for a refetch.
export function liveState(ws, now) {
  if (ws.status === 'purged') return 'purged';
  if (ws.status === 'expired' || new Date(ws.expiresAt).getTime() <= now) return 'expired';
  return new Date(ws.expiresAt).getTime() - now <= 24 * 3600 * 1000 ? 'expiring' : 'active';
}

const BADGES = {
  active: { label: 'Active', icon: FaCheckCircle, cls: 'bg-success/12 text-success border-success/30' },
  expiring: { label: 'Expiring soon', icon: FaClock, cls: 'bg-amber-500/12 text-amber-500 border-amber-500/30' },
  expired: { label: 'Expired', icon: FaBan, cls: 'bg-danger/12 text-danger border-danger/30' },
  purged: { label: 'Data removed', icon: FaArchive, cls: 'bg-surface-muted text-text-muted border-border' },
};

export function StateBadge({ state }) {
  const { label, icon: Icon, cls } = BADGES[state] || BADGES.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const cls =
    role === 'owner'
      ? 'bg-primary/15 text-primary border-primary/30'
      : role === 'editor'
        ? 'bg-surface-muted text-text border-border'
        : 'bg-surface-muted text-text-muted border-border';
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${cls}`}>
      {role === 'owner' ? 'Owner' : role}
    </span>
  );
}

export const EXPIRY_PRESETS = [
  { label: '1 day', ms: 24 * 3600 * 1000 },
  { label: '3 days', ms: 3 * 24 * 3600 * 1000 },
  { label: '7 days', ms: 7 * 24 * 3600 * 1000 },
  { label: '30 days', ms: 30 * 24 * 3600 * 1000 },
];
