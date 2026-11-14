import { Link } from 'react-router';
import { MotionConfig, motion } from 'motion/react';
import { FaArrowRight } from 'react-icons/fa';
import LandingNav from './components/landing/LandingNav';
import HeroPreview from './components/landing/HeroPreview';
import FeatureShowcase from './components/landing/FeatureShowcase';
import WorkspaceSpotlight from './components/landing/WorkspaceSpotlight';
import AiSpotlight from './components/landing/AiSpotlight';
import HowItWorks from './components/landing/HowItWorks';
import SecuritySection from './components/landing/SecuritySection';
import PlansSection from './components/landing/PlansSection';
import { Benefits, FinalCta, LandingFooter } from './components/landing/ClosingSections';
import { BRAND_NAME, BRAND_FULL_NAME } from './brand';

// Public entry page for guests (RootRoute renders it at "/"). Always uses the
// dark brand palette, independent of the in-app theme setting.

const HIGHLIGHTS = ['Email code & Google sign-in', 'Viewer / Editor sharing', 'Self-expiring workspaces', 'Free plan, no card'];

const fadeUp = (delay) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

function Hero() {
  return (
    <section className="relative isolate">
      <div className="landing-hero-bg pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-32 lg:pt-24">
        <div className="text-center lg:text-left">
          <motion.p
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
            Now with ephemeral workspaces &amp; AI file insights
          </motion.p>

          <motion.h1
            {...fadeUp(0.08)}
            className="mx-auto mt-6 max-w-2xl text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:mx-0 lg:text-[4.1rem]"
          >
            Manage smarter.{' '}
            <span className="landing-gradient-text">Collaborate temporarily.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8 lg:mx-0"
          >
            <span className="font-semibold text-slate-200">{BRAND_NAME}</span> — the {BRAND_FULL_NAME}.
            Store and organize your files, share them with exactly the right people, and open temporary
            workspaces that clean up after themselves — all protected by two-step sign-in and checks on
            the server for every request.
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f6df5] px-7 py-3.5 font-semibold text-white shadow-[0_14px_40px_-14px_rgba(79,109,245,1)] transition hover:-translate-y-0.5 hover:bg-[#6a85ff]"
            >
              Get started free
              <FaArrowRight size={12} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-7 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06]"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.ul
            {...fadeUp(0.34)}
            className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-400 lg:justify-start"
          >
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <span className="text-emerald-300" aria-hidden="true">✓</span>
                {h}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing min-h-screen bg-[#070b17] text-slate-200">
        <LandingNav />
        <main>
          <Hero />
          <FeatureShowcase />
          <WorkspaceSpotlight />
          <AiSpotlight />
          <HowItWorks />
          <SecuritySection />
          <PlansSection />
          <Benefits />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}

export default LandingPage;
