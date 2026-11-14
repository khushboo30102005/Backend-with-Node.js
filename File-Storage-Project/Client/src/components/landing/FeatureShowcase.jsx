import { motion } from 'motion/react';
import {
  FaArrowsAlt,
  FaBell,
  FaCloudUploadAlt,
  FaDownload,
  FaEye,
  FaFolderPlus,
  FaHdd,
  FaICursor,
  FaPalette,
  FaSearch,
  FaShareAlt,
  FaTrashRestore,
  FaUserCircle,
} from 'react-icons/fa';
import { CheckItem, IconBadge, Reveal, Section, SectionHeader } from './primitives';

function Tile({ className = '', delay = 0, children }) {
  return (
    <Reveal delay={delay} className={className}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="landing-card group h-full rounded-2xl p-6 sm:p-7"
      >
        {children}
      </motion.article>
    </Reveal>
  );
}

function TileHead({ icon, tone, title, children }) {
  return (
    <>
      <IconBadge icon={icon} tone={tone} />
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{children}</p>
    </>
  );
}

const FILE_ACTIONS = [
  { icon: FaCloudUploadAlt, label: 'Upload' },
  { icon: FaFolderPlus, label: 'New folder' },
  { icon: FaICursor, label: 'Rename' },
  { icon: FaArrowsAlt, label: 'Move' },
  { icon: FaDownload, label: 'Download' },
  { icon: FaShareAlt, label: 'Share' },
];

const PREVIEW_TYPES = ['Images', 'Video', 'Audio', 'PDF', 'Office docs', 'Markdown', 'Code', 'HTML', 'Text & CSV'];

function FeatureShowcase() {
  return (
    <Section id="features">
      <SectionHeader eyebrow="Features" title="Everything your files need, in one drive">
        A complete file manager with sharing, recovery and storage insight built in — not bolted on.
      </SectionHeader>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* File management */}
        <Tile className="lg:col-span-2">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <TileHead icon={FaCloudUploadAlt} title="Complete file management">
                Upload with live progress (and cancel mid-way), build nested folders, then rename, move,
                download or delete — one item at a time or many at once with bulk selection.
              </TileHead>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                <CheckItem>Folder cards, file list and breadcrumbs</CheckItem>
                <CheckItem>Right-click context menu actions</CheckItem>
                <CheckItem>Bulk download, share and delete</CheckItem>
                <CheckItem>Details: path, size, created and updated</CheckItem>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-64">
              {FILE_ACTIONS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2 py-3.5 text-slate-300 transition group-hover:border-white/[0.1]"
                >
                  <Icon size={15} className="text-sky-300" aria-hidden="true" />
                  <span className="text-[11px] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Tile>

        {/* Preview */}
        <Tile delay={0.08}>
          <TileHead icon={FaEye} tone="green" title="Preview without downloading">
            Open files right in the browser through short-lived secure links.
          </TileHead>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {PREVIEW_TYPES.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        </Tile>

        {/* Sharing */}
        <Tile delay={0.04}>
          <TileHead icon={FaShareAlt} tone="violet" title="Sharing with permissions">
            Share files with registered users by email, as a Viewer or an Editor. Change roles or revoke
            access whenever you like.
          </TileHead>
          <div className="mt-5 space-y-2">
            {[
              ['Viewer', 'Can view & download'],
              ['Editor', 'Can also rename'],
            ].map(([role, desc]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2"
              >
                <span className="text-sm font-medium text-white">{role}</span>
                <span className="text-xs text-slate-400">{desc}</span>
              </div>
            ))}
          </div>
        </Tile>

        {/* Trash */}
        <Tile delay={0.08}>
          <TileHead icon={FaTrashRestore} tone="amber" title="Trash & recovery">
            Deleted files and folders go to Trash first. Restore them in one click, or delete them
            permanently when you're sure.
          </TileHead>
        </Tile>

        {/* Storage */}
        <Tile delay={0.12}>
          <TileHead icon={FaHdd} title="Storage you can see">
            A live usage meter shows exactly how much you've used. Your plan's limit is checked before every
            upload.
          </TileHead>
          <ul className="mt-5 space-y-2">
            <CheckItem>File count and largest files, to help you clean up</CheckItem>
            <CheckItem>Workspace storage tracked separately</CheckItem>
            <CheckItem>Items in Trash are counted openly</CheckItem>
          </ul>
        </Tile>

        {/* Search + notifications + personalisation */}
        <Tile delay={0.04}>
          <TileHead icon={FaSearch} title="Find things fast">
            Search the current view instantly by name. With AI turned on, Smart search finds files by what
            they're about.
          </TileHead>
        </Tile>

        <Tile delay={0.08}>
          <TileHead icon={FaBell} tone="violet" title="Notifications that matter">
            The bell shows new shares, workspace invitations, new uploads in your workspaces and
            expiry warnings.
          </TileHead>
        </Tile>

        <Tile delay={0.12}>
          <TileHead icon={FaUserCircle} tone="green" title="Make it yours">
            Upload and crop a profile photo, and choose a light, dark or system theme.
          </TileHead>
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            <FaPalette className="text-emerald-300" aria-hidden="true" /> Light · Dark · System
          </div>
        </Tile>
      </div>
    </Section>
  );
}

export default FeatureShowcase;
