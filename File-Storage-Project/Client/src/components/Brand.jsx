import { FaCloud } from 'react-icons/fa';

// onDark = on the navy sidebar/drawer; otherwise on the page background (mobile header)
function Brand({ className = '', onDark = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${
          onDark ? 'bg-white/15 ring-1 ring-white/20' : 'bg-primary shadow-card'
        }`}
      >
        <FaCloud className="text-white" size={17} />
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${
          onDark ? 'text-white' : 'text-text'
        }`}
      >
        StorageApp
      </span>
    </div>
  );
}

export default Brand;