// Small shared building blocks for the Settings pages.

export function SettingsSection({ title, description, children, tone }) {
  return (
    <section
      className={`rounded-xl border bg-surface shadow-card ${
        tone === 'danger' ? 'border-danger/30' : 'border-border'
      }`}
    >
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-text-muted">{description}</p>
        )}
      </div>
      <div className="px-5 divide-y divide-border">{children}</div>
    </section>
  );
}

export function SettingsRow({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 py-3.5">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      <div className="min-w-0 flex-1 text-sm text-text">{children}</div>
    </div>
  );
}

export function Notice({ kind = 'error', children }) {
  const styles =
    kind === 'success'
      ? 'bg-success/10 text-success border-success/30'
      : kind === 'info'
        ? 'bg-primary/10 text-text border-primary/25'
        : 'bg-red-50 text-danger border-red-200';
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3.5 py-2.5 text-[13px] ${styles}`}
    >
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface text-text transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/12 disabled:opacity-60';

export const primaryBtn =
  'px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30';

export const secondaryBtn =
  'px-4 py-2 rounded-lg border border-border bg-surface text-text text-sm font-semibold hover:enabled:bg-surface-hover hover:enabled:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30';

export const dangerBtn =
  'px-4 py-2 rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm font-semibold hover:enabled:bg-danger hover:enabled:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-danger/30';