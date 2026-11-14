import { FaCloudUploadAlt, FaCrown, FaShareAlt, FaUserCheck } from 'react-icons/fa';
import { IconBadge, Reveal, Section, SectionHeader } from './primitives';

const STEPS = [
  {
    icon: FaUserCheck,
    title: 'Create your account',
    text: 'Sign up with your email and confirm it with a one-time code, or continue with Google.',
  },
  {
    icon: FaCloudUploadAlt,
    title: 'Upload & organize',
    text: 'Upload files to My Drive, arrange them in folders and preview them in the browser.',
  },
  {
    icon: FaShareAlt,
    title: 'Share or collaborate',
    text: 'Share single files with chosen people, or open a temporary workspace for a team.',
  },
  {
    icon: FaCrown,
    title: 'Grow when you need to',
    text: 'Start free. Upgrade to Premium for more storage with a one-time Razorpay payment.',
  },
];

function HowItWorks() {
  return (
    <Section id="how-it-works" className="landing-band">
      <SectionHeader eyebrow="How it works" title="Up and running in minutes">
        No setup and no payment to start. Four steps from sign-up to sharing.
      </SectionHeader>

      <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <li className="landing-card relative h-full rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <IconBadge icon={icon} />
                <span className="font-mono text-sm font-bold text-white/15">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

export default HowItWorks;
