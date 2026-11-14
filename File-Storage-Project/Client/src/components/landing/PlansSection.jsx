import { Link } from 'react-router';
import { FaCheck, FaCrown } from 'react-icons/fa';
import { Reveal, Section, SectionHeader } from './primitives';

// Plans mirror Server/config/plans.js: Free has a 1 GB default limit; Premium
// is storage-only, a one-time purchase (default 30 days, no auto-renewal).
// The Premium price and size are set on the server and shown in-app.

function Feature({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-6 text-slate-300">
      <FaCheck size={11} className="mt-[7px] flex-shrink-0 text-emerald-300" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function PlansSection() {
  return (
    <Section id="plans" className="landing-band">
      <SectionHeader eyebrow="Plans" title="Start free. Add storage when you need it.">
        Every feature is included on both plans. Premium simply gives you more room.
      </SectionHeader>

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        <Reveal>
          <div className="landing-card flex h-full flex-col rounded-3xl p-7 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-white">₹0</span>
              <span className="text-sm text-slate-400">forever</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">For personal files and everyday sharing.</p>
            <ul className="mb-8 mt-6 space-y-2.5">
              <Feature>1 GB of storage</Feature>
              <Feature>File & folder management with previews</Feature>
              <Feature>Sharing with Viewer and Editor roles</Feature>
              <Feature>Trash & recovery</Feature>
              <Feature>Ephemeral workspaces</Feature>
              <Feature>AI insights, when enabled on the server</Feature>
            </ul>
            <Link
              to="/register"
              className="mt-auto block rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.05]"
            >
              Create free account
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="landing-card-premium relative flex h-full flex-col rounded-3xl p-7 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FaCrown size={15} className="text-amber-300" aria-hidden="true" /> Premium
              </h3>
              <span className="rounded-full bg-[#4f6df5]/20 px-2.5 py-0.5 text-xs font-semibold text-sky-200">
                One-time payment
              </span>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-white">More storage</p>
            <p className="mt-2 text-sm text-slate-400">
              Price and storage size are shown on the Plans page after you sign in.
            </p>
            <ul className="mb-8 mt-6 space-y-2.5">
              <Feature>Everything in Free</Feature>
              <Feature>A larger storage limit, applied as soon as payment is confirmed</Feature>
              <Feature>Valid for 30 days, with no auto-renewal</Feature>
              <Feature>Buy again at any time to add another 30 days</Feature>
              <Feature>Secure Razorpay checkout, verified on the server</Feature>
              <Feature>Payment history under Settings → Subscription</Feature>
            </ul>
            <Link
              to="/login"
              className="mt-auto block rounded-xl bg-[#4f6df5] px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(79,109,245,0.9)] transition hover:bg-[#6a85ff]"
            >
              Sign in to upgrade
            </Link>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-slate-500">
          When Premium ends, your account returns to the Free limit. If you're over it, new uploads pause,
          but you can still download and delete your files.
        </p>
      </Reveal>
    </Section>
  );
}

export default PlansSection;
