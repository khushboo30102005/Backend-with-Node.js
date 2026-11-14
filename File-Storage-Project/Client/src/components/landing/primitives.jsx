import { motion } from 'motion/react';

// Shared building blocks for the public landing page sections.

export function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }) {
  return (
    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
      <span className="h-px w-6 bg-gradient-to-r from-sky-400 to-indigo-500" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeader({ eyebrow, title, children, align = 'center' }) {
  const centered = align === 'center';
  return (
    <Reveal className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-base leading-7 text-slate-400">{children}</p>}
    </Reveal>
  );
}

export function IconBadge({ icon: Icon, tone = 'blue', size = 'md' }) {
  const tones = {
    blue: 'from-sky-400/20 to-indigo-500/20 text-sky-300 ring-sky-400/20',
    violet: 'from-violet-400/20 to-fuchsia-500/20 text-violet-300 ring-violet-400/20',
    green: 'from-emerald-400/20 to-teal-500/20 text-emerald-300 ring-emerald-400/20',
    amber: 'from-amber-400/20 to-orange-500/20 text-amber-300 ring-amber-400/20',
  };
  const box = size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-11 w-11 rounded-xl';
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center bg-gradient-to-br ring-1 ${box} ${tones[tone]}`}
      aria-hidden="true"
    >
      <Icon size={size === 'sm' ? 15 : 18} />
    </span>
  );
}

// Section wrapper with consistent spacing and an anchor offset for the sticky nav.
export function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`relative scroll-mt-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:py-28">{children}</div>
    </section>
  );
}

export function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-6 text-slate-300">
      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}
