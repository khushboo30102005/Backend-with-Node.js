import {
  FaCookieBite,
  FaFileSignature,
  FaFingerprint,
  FaGoogle,
  FaKey,
  FaLink,
  FaShieldAlt,
  FaTachometerAlt,
  FaUserShield,
} from 'react-icons/fa';
import { IconBadge, Reveal, Section, SectionHeader } from './primitives';

const CONTROLS = [
  {
    icon: FaFingerprint,
    title: 'Two-step sign-in',
    text: 'Password sign-in is confirmed with a one-time code sent to your email. Codes work once and attempts are rate-limited.',
  },
  {
    icon: FaGoogle,
    title: 'Google Sign-In',
    text: 'Sign in with your Google account, and add a password later if you want both options.',
  },
  {
    icon: FaKey,
    title: 'Secure sessions',
    text: 'Sessions are kept on the server and sent as signed, httpOnly cookies. Each account has at most two active sessions, and you can sign out of all devices at once.',
  },
  {
    icon: FaCookieBite,
    title: 'CSRF protection',
    text: 'Every request that changes data must carry a signed token tied to your session, so other sites can’t act on your behalf.',
  },
  {
    icon: FaUserShield,
    title: 'Role-based access',
    text: 'Owner, Admin, Manager and User roles. Each role can only manage accounts ranked below it, and every check runs on the server.',
  },
  {
    icon: FaLink,
    title: 'Private file links',
    text: 'Files sit in private cloud storage and open only through short-lived signed links, after your access has been checked.',
  },
  {
    icon: FaFileSignature,
    title: 'Upload validation',
    text: 'Uploaded files are checked by their actual content, not just the extension, and must fit within your storage limit.',
  },
  {
    icon: FaTachometerAlt,
    title: 'Rate limiting',
    text: 'Sign-in, codes, uploads, invitations and payments each have their own limits to slow down abuse.',
  },
  {
    icon: FaShieldAlt,
    title: 'Hardened by default',
    text: 'Passwords are hashed with bcrypt, security headers are set on every response, and payments are verified by signature on the server.',
  },
];

function SecuritySection() {
  return (
    <Section id="security">
      <div className="landing-security relative overflow-hidden rounded-3xl border border-white/[0.08] px-5 py-14 sm:px-10 lg:px-14 lg:py-16">
        <SectionHeader eyebrow="Security" title="Security built into every request">
          Protection isn't a single feature — it's a set of checks that run on the server every time you
          sign in, upload, share or pay.
        </SectionHeader>

        <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {CONTROLS.map(({ icon, title, text }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.07}>
              <div className="flex gap-4">
                <IconBadge icon={icon} tone={i % 3 === 1 ? 'violet' : i % 3 === 2 ? 'green' : 'blue'} size="sm" />
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

export default SecuritySection;
