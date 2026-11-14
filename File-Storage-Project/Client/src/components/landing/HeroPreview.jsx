import { motion } from 'motion/react';
import {
  FaBell,
  FaCheck,
  FaChevronRight,
  FaCloud,
  FaDownload,
  FaFileAlt,
  FaFileImage,
  FaFilePdf,
  FaFileVideo,
  FaFolder,
  FaHdd,
  FaHourglassHalf,
  FaMagic,
  FaPlus,
  FaSearch,
  FaShareAlt,
  FaTrash,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';

// Illustrative UI preview mirroring the real app shell (sidebar, top bar,
// file list, selection toolbar). All names and sizes are sample data.

const NAV = [
  { icon: FaHdd, label: 'My Drive', active: true },
  { icon: FaUserFriends, label: 'Shared with me' },
  { icon: FaUsers, label: 'Workspaces' },
  { icon: FaTrash, label: 'Trash' },
];

const ROWS = [
  { icon: FaFolder, tone: 'text-sky-300', name: 'Client assets', meta: 'Folder', size: '—' },
  { icon: FaFilePdf, tone: 'text-rose-300', name: 'invoice-0423.pdf', meta: 'PDF', size: '184 KB', selected: true },
  { icon: FaFileAlt, tone: 'text-indigo-300', name: 'brand-guide.md', meta: 'Markdown', size: '12 KB' },
  { icon: FaFileImage, tone: 'text-emerald-300', name: 'hero-shot.png', meta: 'Image', size: '2.1 MB' },
  { icon: FaFileVideo, tone: 'text-amber-300', name: 'product-demo.mp4', meta: 'Video', size: '48 MB' },
];

function FloatCard({ className, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`absolute z-20 hidden rounded-2xl border border-white/10 bg-[#111a2e]/90 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-md md:block ${className}`}
    >
      <div className="landing-float" style={{ animationDelay: `${delay}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.15 }}
      className="relative mx-auto w-full max-w-[640px]"
      aria-hidden="true"
    >
      <div className="landing-glow absolute -inset-8 -z-10 rounded-[48px]" />

      {/* App window */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] shadow-[0_40px_120px_-40px_rgba(79,109,245,0.55)] ring-1 ring-white/[0.04]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0d1527] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f0656d]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 truncate rounded-md bg-white/[0.04] px-3 py-1 text-[10px] text-slate-500">
            storageapp / mydrive
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr]">
          {/* Sidebar */}
          <div className="sidebar-surface hidden flex-col justify-between p-3 sm:flex">
            <div>
              <div className="mb-4 flex items-center gap-2 px-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500">
                  <FaCloud className="text-white" size={11} />
                </span>
                <span className="text-[11px] font-bold text-white">StorageApp</span>
              </div>
              <div className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#4f6df5] py-1.5 text-[10px] font-semibold text-white">
                <FaPlus size={8} /> New
              </div>
              {NAV.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`mb-0.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                    active ? 'bg-white/10 text-white' : 'text-slate-400'
                  }`}
                >
                  <Icon size={10} /> {label}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-white/[0.05] p-2">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Storage</span>
                <span className="text-slate-300">31%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '31%' }}
                  transition={{ duration: 1.4, delay: 0.9 }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                />
              </div>
              <p className="mt-1.5 text-[8.5px] text-slate-500">318 MB of 1 GB used</p>
            </div>
          </div>

          {/* Main */}
          <div className="min-w-0 p-3 sm:p-4">
            {/* Top bar */}
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#111a2e] px-2.5 py-1.5 text-[10px] text-slate-500">
                <FaSearch size={9} className="flex-shrink-0" />
                <span className="truncate">Search files and folders...</span>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/15 text-violet-300">
                <FaMagic size={9} />
              </span>
              <span className="relative flex h-6 w-6 items-center justify-center rounded-lg text-slate-400">
                <FaBell size={10} />
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#f0656d]" />
              </span>
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
            </div>

            {/* Breadcrumb */}
            <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
              <span>My Drive</span>
              <FaChevronRight size={7} />
              <span className="font-semibold text-slate-200">Projects</span>
            </div>

            {/* Selection toolbar */}
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-[#4f6df5]/30 bg-[#4f6df5]/10 px-2.5 py-1.5">
              <span className="text-[10px] font-semibold text-slate-200">1 selected</span>
              <div className="flex gap-2.5 text-slate-300">
                <FaDownload size={9} />
                <FaShareAlt size={9} />
                <FaTrash size={9} />
              </div>
            </div>

            {/* File rows */}
            <div className="mt-2 divide-y divide-white/[0.05] rounded-lg border border-white/[0.06]">
              {ROWS.map(({ icon: Icon, tone, name, meta, size, selected }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 ${selected ? 'bg-[#4f6df5]/[0.08]' : ''}`}
                >
                  <span
                    className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-[3px] border ${
                      selected ? 'border-[#4f6df5] bg-[#4f6df5]' : 'border-white/20'
                    }`}
                  >
                    {selected && <FaCheck size={6} className="text-white" />}
                  </span>
                  <Icon size={12} className={`flex-shrink-0 ${tone}`} />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium text-slate-200">{name}</span>
                  <span className="hidden w-14 text-[9.5px] text-slate-500 sm:block">{meta}</span>
                  <span className="w-12 text-right text-[9.5px] text-slate-500">{size}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI insight */}
      <FloatCard className="-right-6 -top-6 w-56 lg:-right-12" delay={1}>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-violet-300">
          <FaMagic size={10} /> AI insight
        </div>
        <p className="mt-1.5 text-[10px] leading-4 text-slate-300">
          Invoice for April design services, with line items and a due date.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {['invoice', 'billing', 'design'].map((t) => (
            <span key={t} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] text-violet-200">
              {t}
            </span>
          ))}
        </div>
      </FloatCard>

      {/* Workspace expiry */}
      <FloatCard className="-bottom-8 -left-6 w-60 lg:-left-14" delay={1.3}>
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
            <FaHourglassHalf size={12} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-white">Launch review</p>
            <p className="text-[9.5px] text-slate-400">Workspace · 4 members</p>
            <p className="mt-1 inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-medium text-amber-200">
              Expires in 2 days · auto-cleanup
            </p>
          </div>
        </div>
      </FloatCard>
    </motion.div>
  );
}

export default HeroPreview;
