import { FaCloud } from 'react-icons/fa';

// onDark = on the navy sidebar/drawer; otherwise on the page background (mobile header)
function Brand({ className = '', onDark = true, compact = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${
          onDark
            ? 'bg-linear-to-br from-sky-400 to-indigo-500 shadow-[0_6px_16px_-6px_rgba(59,130,246,0.9)]'
            : 'bg-primary shadow-card'
        }`}
      >
        <FaCloud className="text-white" size={17} />
      </span>
      {!compact && (
        <span
          className={`text-[17px] font-bold tracking-tight ${
            onDark ? 'text-white' : 'text-text'
          }`}
        >
          StorageApp
        </span>
      )}
    </div>
  );
}

export default Brand;