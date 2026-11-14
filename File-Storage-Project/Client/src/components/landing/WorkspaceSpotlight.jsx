import {
  FaArchive,
  FaClipboardList,
  FaExchangeAlt,
  FaHourglassHalf,
  FaRegClock,
  FaUserPlus,
} from 'react-icons/fa';
import { CheckItem, IconBadge, Reveal, Section, SectionHeader } from './primitives';

const LIFECYCLE = [
  {
    icon: FaUserPlus,
    title: 'Create & invite',
    text: 'Name the workspace, set an expiry anywhere from 5 minutes to 90 days ahead, and invite people as Editors or Viewers. Invitees get access only after they accept.',
  },
  {
    icon: FaExchangeAlt,
    title: 'Work together',
    text: 'Upload files, create folders, import from My Drive, or save a copy back to your own drive. Every action is recorded in the activity log.',
  },
  {
    icon: FaRegClock,
    title: 'Expires on time',
    text: 'Members get a warning in the last 24 hours. At the expiry moment access ends for everyone, checked on every request.',
  },
  {
    icon: FaArchive,
    title: 'Cleans itself up',
    text: 'Choose a cleanup policy: delete everything right away, or archive it read-only for 30 days so the owner can reactivate it.',
  },
];

const ROLES = [
  ['View, download, save to My Drive', true, true, true],
  ['Upload, import, new folder, rename', true, true, false],
  ['Move & delete files', 'Any', 'Own', false],
  ['Invite, roles, settings, transfer', true, false, false],
];

function Cell({ value }) {
  if (value === true) return <span className="text-emerald-300" aria-label="Allowed">✓</span>;
  if (value === false) return <span className="text-slate-600" aria-label="Not allowed">—</span>;
  return <span className="text-xs font-medium text-slate-300">{value}</span>;
}

function WorkspaceSpotlight() {
  return (
    <Section id="workspaces" className="landing-band">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHeader align="left" eyebrow="Ephemeral workspaces" title="Shared spaces that don't outstay their welcome">
            Spin up a temporary workspace for a project, a review or a hand-off. When the time is up,
            access is revoked automatically and the data is archived or deleted — no forgotten folders,
            no lingering access.
          </SectionHeader>

          <Reveal delay={0.1} className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1527]/70">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Workspace permissions by role</caption>
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-4 py-3 font-semibold">Permission</th>
                  <th scope="col" className="px-2 py-3 text-center font-semibold">Owner</th>
                  <th scope="col" className="px-2 py-3 text-center font-semibold">Editor</th>
                  <th scope="col" className="px-2 py-3 text-center font-semibold">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {ROLES.map(([label, ...cells]) => (
                  <tr key={label}>
                    <th scope="row" className="px-4 py-3 text-[13px] font-normal text-slate-300">{label}</th>
                    {cells.map((c, i) => (
                      <td key={i} className="px-2 py-3 text-center">
                        <Cell value={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>

        <div>
          <ol className="relative space-y-4">
            <span
              className="absolute bottom-6 left-[21px] top-6 w-px bg-gradient-to-b from-sky-400/60 via-indigo-500/40 to-transparent"
              aria-hidden="true"
            />
            {LIFECYCLE.map(({ icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <li className="landing-card relative flex gap-4 rounded-2xl p-5">
                  <IconBadge icon={icon} tone={i === 3 ? 'amber' : 'blue'} />
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Step {i + 1}</p>
                    <h3 className="mt-0.5 font-semibold text-white">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.2} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="landing-card rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaHourglassHalf className="text-amber-300" aria-hidden="true" /> Owner controls
              </div>
              <ul className="mt-3 space-y-1.5">
                <CheckItem>Extend the expiry or edit settings</CheckItem>
                <CheckItem>Transfer ownership to a member</CheckItem>
                <CheckItem>Delete the workspace instantly</CheckItem>
              </ul>
            </div>
            <div className="landing-card rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FaClipboardList className="text-sky-300" aria-hidden="true" /> Kept separate
              </div>
              <ul className="mt-3 space-y-1.5">
                <CheckItem>Its own storage quota, apart from My Drive</CheckItem>
                <CheckItem>Up to 50 members per workspace</CheckItem>
                <CheckItem>Full activity log for everyone</CheckItem>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

export default WorkspaceSpotlight;
