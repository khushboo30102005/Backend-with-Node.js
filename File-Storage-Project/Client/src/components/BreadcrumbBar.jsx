import { useState, useRef, useEffect } from 'react';
import { FaHome, FaChevronRight, FaEllipsisH } from 'react-icons/fa';

const MAX_VISIBLE = 4; 

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

  // When collapsing: show first (home), an ellipsis for the middle chunk,
  // then the last 2 segments — keeps navigation to nearby folders visible
  // while hiding the long middle of a deep path.
  const first = breadcrumb[0];
  const lastTwo = breadcrumb.slice(-2);
  const hiddenMiddle = shouldCollapse ? breadcrumb.slice(1, -2) : [];
  const visible = shouldCollapse ? [first, ...lastTwo] : breadcrumb;

  function renderCrumb(crumb, isLast, isFirst, key) {
    return (
      <span key={key} className="flex items-center gap-1.5">
        {isLast ? (
          <span className="flex items-center gap-1.5 font-semibold text-text px-2 py-1 rounded-md truncate max-w-[160px] sm:max-w-[240px]">
            {isFirst && <FaHome size={13} className="text-primary flex-shrink-0" />}
            <span className="truncate">{crumb.name}</span>
          </span>
        ) : (
          <button
            onClick={() => onBreadcrumbClick(crumb.id)}
            className="flex items-center gap-1.5 text-text-muted px-2 py-1 rounded-md hover:bg-gray-100 hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-[180px]"
          >
            {isFirst && <FaHome size={13} className="flex-shrink-0" />}
            <span className="truncate">{crumb.name}</span>
          </button>
        )}
        {!isLast && <FaChevronRight size={9} className="text-gray-300 flex-shrink-0" />}
      </span>
    );
  }

  return (
    <nav className="flex items-center flex-nowrap overflow-x-auto gap-1 px-1 py-2.5 text-sm border-b border-border bg-surface sticky top-0 z-10">
      {shouldCollapse ? (
        <>
          {renderCrumb(first, false, true, first.id)}

          <div className="relative flex-shrink-0" ref={hiddenMenuRef}>
            <button
              onClick={() => setShowHidden((prev) => !prev)}
              className="flex items-center justify-center text-text-muted px-2 py-1 rounded-md hover:bg-gray-100 hover:text-primary transition-colors"
              title="Show hidden folders"
            >
              <FaEllipsisH size={12} />
            </button>

            {showHidden && (
              <div className="absolute top-8 left-0 bg-surface border border-border rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] z-[999] min-w-[160px] max-h-[240px] overflow-y-auto py-1">
                {hiddenMiddle.map((crumb) => (
                  <button
                    key={crumb.id}
                    onClick={() => {
                      onBreadcrumbClick(crumb.id);
                      setShowHidden(false);
                    }}
                    className="block w-full text-left px-3.5 py-2 text-sm text-gray-700 truncate hover:bg-gray-100 transition-colors"
                  >
                    {crumb.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FaChevronRight size={9} className="text-gray-300 flex-shrink-0" />

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
  );
}

export default BreadcrumbBar;