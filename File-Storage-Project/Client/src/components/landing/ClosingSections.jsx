import { Link } from 'react-router';
import { FaArrowRight, FaBalanceScale, FaEye, FaLayerGroup, FaUserLock } from 'react-icons/fa';
import Brand from '../Brand';
import { NAV_LINKS } from './LandingNav';
import { IconBadge, Reveal, Section, SectionHeader } from './primitives';

const BENEFITS = [
  {
    icon: FaLayerGroup,
    title: 'Personal and team files in one place',
    text: 'My Drive for your own files, Shared with me for files from others, and workspaces for temporary teamwork.',
  },
  {
    icon: FaUserLock,
    title: 'Access that ends when it should',
    text: 'Revoke a share in one click, or let a workspace expire. Nobody keeps access by accident.',
  },
  {
    icon: FaEye,
    title: 'No surprises about storage',
    text: 'See what you use, what counts toward your limit and which files take up the most room.',
  },
  {
    icon: FaBalanceScale,
    title: 'Pay only when you choose to',
    text: 'Premium is a one-time purchase with no auto-renewal, so you are never charged without knowing.',
  },
];

export function Benefits() {
  return (
    <Section id="benefits">
      <SectionHeader eyebrow="Why StorageApp" title="Designed around control and clarity" />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.07}>
            <div className="h-full border-l border-white/10 pl-5">
              <IconBadge icon={icon} size="sm" />
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="relative px-4 pb-24 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <div className="landing-cta relative overflow-hidden rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Your files, under your control.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Create a free account in under a minute — just your email, or your Google account.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-[#0a1020] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(255,255,255,0.5)]"
            >
              Get started free
              <FaArrowRight size={12} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.06]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Brand />
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Secure cloud storage with sharing, temporary workspaces and optional AI insights.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-14 gap-y-2.5 text-sm sm:grid-cols-3">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-slate-400 transition hover:text-white">
              {l.label}
            </a>
          ))}
          <a href="#how-it-works" className="text-slate-400 transition hover:text-white">
            How it works
          </a>
          <Link to="/login" className="text-slate-400 transition hover:text-white">
            Sign in
          </Link>
          <Link to="/register" className="text-slate-400 transition hover:text-white">
            Create account
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-600 sm:px-6">
          © {new Date().getFullYear()} StorageApp
        </p>
      </div>
    </footer>
  );
}
