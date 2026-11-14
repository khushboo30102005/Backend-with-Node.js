import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FaBars, FaTimes } from 'react-icons/fa';
import Brand from '../Brand';

export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#workspaces', label: 'Workspaces' },
  { href: '#ai', label: 'AI' },
  { href: '#security', label: 'Security' },
  { href: '#plans', label: 'Plans' },
];

function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? 'border-white/[0.08] bg-[#070b17]/85 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link to="/" aria-label="SFECAPP home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-sky-400">
          <Brand />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[#4f6df5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(79,109,245,0.9)] transition hover:bg-[#6a85ff]"
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
          >
            {open ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="landing-mobile-nav"
          aria-label="Mobile"
          className="animate-fade-in border-t border-white/[0.08] px-4 pb-5 pt-2 lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-[15px] font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                to="/login"
                className="block rounded-lg px-3 py-3 text-[15px] font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default LandingNav;
