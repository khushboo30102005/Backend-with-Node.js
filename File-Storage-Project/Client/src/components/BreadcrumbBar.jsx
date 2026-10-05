import { useState, useRef, useEffect } from 'react';
import { FaHome, FaChevronRight, FaEllipsisH } from 'react-icons/fa';

const MAX_VISIBLE = 4;

// Vertical padding is owned by the parent row now (it shares a line with the
// Select control), so this component adds none of its own.
function BreadcrumbBar({ breadcrumb = [], onBreadcrumbClick }) {
  const [showHidden, setShowHidden] = useState(false);
  const hiddenMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (hiddenMenuRef.current && !hiddenMenuRef.current.contains(e.target)) {
        setShowHidden(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (breadcrumb.length === 0) return null;

  const shouldCollapse = breadcrumb.length > MAX_VISIBLE;

  const first = breadcrumb[0];
  const lastTwo = breadcrumb.slice(-2);
  const hiddenMiddle = shouldCollapse ? breadcrumb.slice(1, -2) : [];
  const visible = shouldCollapse ? [first, ...lastTwo] : breadcrumb;

  function renderCrumb(crumb, isLast, isFirst, key) {
    return (
      <span key={key} className="flex items-center gap-1.5">
        {isLast ? (
          <span className="flex items-center gap-1.5 font-semibold text-text px-2 py-1 rounded-md truncate max-w-[240px]">
            {isFirst && (
              <FaHome size={14} className="text-primary flex-shrink-0" />
            )}
            <span className="truncate">{crumb.name}</span>
          </span>
        ) : (
          <button
            onClick={() => onBreadcrumbClick(crumb.id)}
            className="flex items-center gap-1.5 text-text-muted px-2 py-1 rounded-md hover:bg-surface-muted hover:text-primary transition-colors truncate max-w-[180px]"
          >
            {isFirst && <FaHome size={14} className="flex-shrink-0" />}
            <span className="truncate">{crumb.name}</span>
          </button>
        )}
        {!isLast && (
          <FaChevronRight size={9} className="text-text-muted/60 flex-shrink-0" />
        )}
      </span>
    );
  }

  // Mobile: a simplified trail — Home › … › Parent › Current — that never overflows.
  const last = breadcrumb[breadcrumb.length - 1];
  const parent = breadcrumb.length > 2 ? breadcrumb[breadcrumb.length - 2] : null;
  const hasHiddenLevels = breadcrumb.length > 3;
  const chevron = (
    <FaChevronRight size={9} className="text-text-muted/60 flex-shrink-0" />
  );

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="sm:hidden flex items-center gap-1 text-sm min-w-0"
      >
        {breadcrumb.length === 1 ? (
          <span className="flex items-center gap-2 min-w-0 font-semibold text-text">
            <FaHome size={14} className="text-primary flex-shrink-0" />
            <span className="truncate">{last.name}</span>
          </span>
        ) : (
          <>
            <button
              onClick={() => onBreadcrumbClick(first.id)}
              aria-label={first.name}
              className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg text-primary hover:bg-surface-muted transition-colors flex-shrink-0"
            >
              <FaHome size={15} />
            </button>
            {chevron}
            {hasHiddenLevels && (
              <>
                <span className="text-text-muted px-0.5">…</span>
                {chevron}
              </>
            )}
            {parent && (
              <>
                <button
                  onClick={() => onBreadcrumbClick(parent.id)}
                  className="min-h-9 px-2 rounded-lg text-text-muted hover:bg-surface-muted hover:text-primary transition-colors truncate max-w-[30vw]"
                >
                  {parent.name}
                </button>
                {chevron}
              </>
            )}
            <span className="font-semibold text-text truncate min-w-0 px-1">
              {last.name}
            </span>
          </>
        )}
      </nav>

      {/* ≥ 640px: full trail with collapsing middle */}
      <nav
        aria-label="Breadcrumb"
        className={`hidden sm:flex items-center flex-nowrap gap-1 text-[13px] ${
          shouldCollapse ? 'overflow-visible' : 'overflow-x-auto'
        }`}
      >
        {shouldCollapse ? (
          <>
            {renderCrumb(first, false, true, first.id)}

            <div className="relative flex-shrink-0" ref={hiddenMenuRef}>
              <button
                onClick={() => setShowHidden((prev) => !prev)}
                className="flex items-center justify-center text-text-muted px-2 py-1 rounded-md hover:bg-surface-muted hover:text-primary transition-colors"
                title="Show hidden folders"
              >
                <FaEllipsisH size={12} />
              </button>

              {showHidden && (
                <div className="absolute top-9 left-0 bg-surface border border-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] z-[999] min-w-[180px] max-h-[240px] overflow-y-auto p-1">
                  {hiddenMiddle.map((crumb) => (
                    <button
                      key={crumb.id}
                      onClick={() => {
                        onBreadcrumbClick(crumb.id);
                        setShowHidden(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-text rounded-lg truncate hover:bg-surface-muted transition-colors"
                    >
                      {crumb.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FaChevronRight size={9} className="text-text-muted/60 flex-shrink-0" />

            {lastTwo.map((crumb, i) =>
              renderCrumb(crumb, i === lastTwo.length - 1, false, crumb.id),
            )}
          </>
        ) : (
          visible.map((crumb, i) =>
            renderCrumb(crumb, i === visible.length - 1, i === 0, crumb.id),
          )
        )}
      </nav>
    </>
  );
}

export default BreadcrumbBar;