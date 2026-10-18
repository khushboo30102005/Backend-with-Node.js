import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

// Google serves a tiny thumbnail by default (…=s96-c); ask for a bigger one.
function enlarge(src) {
  return src?.includes('googleusercontent.com')
    ? src.replace(/=s\d+(-c)?(?=$|[?#])/, '=s400-c')
    : src;
}

// Lightbox that shows a profile photo larger. Close with Esc, the X button
// or by clicking the dark area.
export function PhotoViewer({ src, name, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name ? `${name}'s profile photo` : 'Profile photo'}
    >
      <div
        className="relative flex flex-col items-center gap-3 animate-menu-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={enlarge(src)}
          alt={name ? `${name}'s profile photo` : 'Profile photo'}
          className="w-72 max-w-[85vw] aspect-square rounded-2xl object-cover bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        />
        {name && (
          <p className="text-sm font-semibold text-white max-w-[85vw] truncate">
            {name}
          </p>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex items-center justify-center w-8 h-8 rounded-full bg-surface text-text shadow-md hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40"
        >
          <FaTimes size={13} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

// Wraps an avatar so clicking it opens the viewer. Renders the avatar
// unchanged when there is no photo to show.
export function ViewablePhoto({ src, name, className = '', children }) {
  const [open, setOpen] = useState(false);
  if (!src) return children;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={name ? `View ${name}'s photo` : 'View photo'}
        title="View photo"
        className={`rounded-full cursor-zoom-in flex-shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 ${className}`}
      >
        {children}
      </button>
      {open && (
        <PhotoViewer src={src} name={name} onClose={() => setOpen(false)} />
      )}
    </>
  );
}