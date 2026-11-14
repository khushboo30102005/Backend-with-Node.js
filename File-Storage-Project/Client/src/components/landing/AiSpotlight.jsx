import { FaLock, FaMagic, FaSearch, FaTags } from 'react-icons/fa';
import { IconBadge, Reveal, Section, SectionHeader } from './primitives';

const CAPABILITIES = [
  {
    icon: FaMagic,
    title: 'Summaries on demand',
    text: 'Analyze a document to get a 2–4 sentence summary in its own language, right in the file details panel.',
  },
  {
    icon: FaTags,
    title: 'Category & tags',
    text: 'Each analyzed file gets one category (invoice, resume, contract, report and more) plus 3–8 descriptive tags.',
  },
  {
    icon: FaSearch,
    title: 'Smart search',
    text: 'Describe what you need in plain words. Semantic search looks across your own files and files shared with you, skipping anything in Trash.',
  },
  {
    icon: FaLock,
    title: 'Private by default',
    text: 'Designed to run on a local model. Hosted AI providers stay blocked unless an admin allows them and you confirm each request.',
  },
];

function AiSpotlight() {
  return (
    <Section id="ai">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
        {/* Illustrative smart search preview */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative" aria-hidden="true">
            <div className="landing-glow-violet absolute -inset-6 -z-10 rounded-[40px]" />
            <div className="rounded-2xl border border-white/10 bg-[#0d1527] p-4 shadow-2xl shadow-black/40 sm:p-5">
              <div className="flex items-center gap-2.5 rounded-xl border border-violet-400/30 bg-[#111a2e] px-3.5 py-3">
                <FaMagic className="flex-shrink-0 text-violet-300" size={13} />
                <span className="truncate text-sm text-slate-200">contracts that mention a renewal date</span>
                <span className="landing-caret ml-0.5 h-4 w-px bg-violet-300" />
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  ['vendor-agreement-2025.pdf', 'contract', ['renewal', 'vendor', 'terms']],
                  ['office-lease.docx', 'contract', ['lease', 'renewal', 'notice period']],
                  ['saas-subscription.pdf', 'invoice', ['subscription', 'billing']],
                ].map(([name, cat, tags]) => (
                  <div key={name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-white">{name}</span>
                      <span className="flex-shrink-0 rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
                        {cat}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] text-violet-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-slate-500">Sample results for illustration</p>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeader align="left" eyebrow="AI file intelligence" title="Understand your documents, not just store them">
            Optional AI features read your documents so you don't have to. They're switched on by the
            server administrator and work with text, Markdown, code, HTML, PDF (up to 40 pages) and
            DOCX files up to 10 MB.
          </SectionHeader>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map(({ icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div className="h-full">
                  <IconBadge icon={icon} tone="violet" size="sm" />
                  <h3 className="mt-3 font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export default AiSpotlight;
