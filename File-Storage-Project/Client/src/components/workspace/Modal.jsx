// Small confirm/form dialog: centred on desktop, bottom sheet on phones.
function Modal({ title, children, onClose, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <div
        className={`bg-surface text-text w-full ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'} max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] animate-sheet-up`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default Modal;
