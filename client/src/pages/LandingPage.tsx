import { Link, useNavigate } from 'react-router-dom';
import {
  Radar,
  PenLine,
  Users,
  ReceiptText,
  CalendarDays,
  AlertTriangle,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDemoLogin, useMe } from '@/lib/queries';
import { DemoButtons } from '@/components/DemoControls';
import { Button, Card } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { FOUNDER, SITE } from '@/config';

const PROBLEMS = [
  { t: 'Newcomers get ignored', d: 'First posts go unanswered, so new members quietly never come back.' },
  { t: 'Helpers burn out', d: 'One or two people answer everything until they stop showing up.' },
  { t: 'Rules become vague', d: 'Members guess what’s allowed and find out only when something is removed.' },
  { t: 'Decisions feel arbitrary', d: 'A post disappears with no explanation, and trust quietly erodes.' },
  { t: 'Good contributors drift', d: 'Your best helpers go quiet, and no one notices until it’s late.' },
  { t: 'AI misses context', d: 'Black-box filters flag the wrong things and frustrate good contributors.' },
];

const PILLARS: { t: string; d: string; chip: string; icon: LucideIcon }[] = [
  {
    t: 'Trust Radar',
    d: 'Detects where trust is breaking right now — ignored newcomers, ageing review queues, rules causing confusion — as clear insight cards.',
    chip: 'bg-primary-soft text-primary-strong',
    icon: Radar,
  },
  {
    t: 'Post Coach',
    d: 'Helps members write posts that get better answers, with specific, community-aware suggestions before they publish.',
    chip: 'bg-teal/10 text-teal',
    icon: PenLine,
  },
  {
    t: 'Newcomer Rescue',
    d: 'Surfaces first-time posters waiting for a reply, so a helper can welcome them before they give up and leave.',
    chip: 'bg-approved/10 text-[#166534]',
    icon: Users,
  },
  {
    t: 'Decision Receipts',
    d: 'Every moderation decision explained: the rule, the reason, who reviewed it, what happens next, and how to appeal.',
    chip: 'bg-navy/5 text-navy',
    icon: ReceiptText,
  },
  {
    t: 'Weekly Trust Report',
    d: 'A founder report on what improved, what needs attention, and the few actions that matter most next week.',
    chip: 'bg-borderline/10 text-[#b45309]',
    icon: CalendarDays,
  },
];

const STEPS = [
  { n: 1, t: 'Detect', d: 'Trust Radar finds the quiet fractures before they show.' },
  { n: 2, t: 'Coach', d: 'Post Coach helps members write posts that succeed.' },
  { n: 3, t: 'Rescue', d: 'Newcomer Rescue gets first-timers a reply in time.' },
  { n: 4, t: 'Explain', d: 'Decision Receipts keep every call understandable and fair.' },
];

const COMPARE = {
  old: ['Waits for reports', 'Removes content', 'Hides the reasoning', 'Burns out moderators', 'Treats symptoms'],
  civitas: [
    'Detects early trust fractures',
    'Helps people write better posts',
    'Rescues ignored newcomers',
    'Explains every decision',
    'Recommends weekly actions',
  ],
};

const AUDIENCE = [
  'Course communities',
  'Creator communities',
  'Open-source projects',
  'Programming help groups',
  'Indie maker communities',
  'Professional communities',
];

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-5xl px-4 ${className}`}>{children}</section>;
}

export function LandingPage() {
  const { data: me } = useMe();
  const demo = useDemoLogin();
  const navigate = useNavigate();

  const exploreDemo = async () => {
    if (me?.demo) {
      try {
        await demo.mutateAsync('founder');
        navigate('/feed');
        return;
      } catch {
        /* fall through */
      }
    }
    navigate('/feed');
  };

  return (
    <div className="-mt-8 pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-teal/10 blur-3xl"
          aria-hidden
        />
        <Section className="relative py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs font-semibold text-muted">
                <Logo size={16} className="text-navy" />
                The trust diagnostic layer for online communities
              </span>
              <h1 className="mt-5 text-balance font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tight text-navy sm:text-6xl">
                {SITE.headline}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">{SITE.subheadline}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" onClick={exploreDemo} loading={demo.isPending}>
                  Explore live demo
                </Button>
                <Link to="/case-study">
                  <Button size="lg" variant="secondary">
                    Read the case study
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">{SITE.trustLine}</p>

              {me?.demo && (
                <div className="mt-8">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Jump in as…</p>
                  <DemoButtons />
                </div>
              )}
            </div>

            {/* Product preview — a real-looking Trust Radar so the hero shows the product */}
            <div className="relative hidden animate-fade-up lg:block">
              <div
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-teal/15 blur-2xl"
                aria-hidden
              />
              <div className="relative rotate-[1.2deg] rounded-2xl border border-border bg-surface p-5 shadow-pop transition-transform duration-500 ease-out-expo hover:rotate-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-sm font-bold text-navy">
                    <Logo size={18} className="text-navy" /> Trust Radar
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-rejected/10 px-2.5 py-0.5 text-xs font-bold text-[#b91c1c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" /> At risk
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">Programming Help Hub · this week</p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-border bg-bg p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rejected/10 text-[#b91c1c]">
                        <Users className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">Newcomers are being ignored</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          3 first-time posters have no reply yet (longest waiting 56h).
                        </p>
                        <span className="mt-2 inline-block text-xs font-semibold text-primary-strong">
                          Rescue newcomers →
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-bg p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-borderline/10 text-[#b45309]">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">“Critique code, not people” needs examples</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          Most holds this week cited this norm. Add good / not-okay examples.
                        </p>
                        <span className="mt-2 inline-block text-xs font-semibold text-primary-strong">
                          Open the charter →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* a small floating "receipt" chip for depth */}
              <div className="absolute -bottom-5 -left-6 hidden rotate-[-3deg] rounded-xl border border-border bg-surface px-4 py-3 shadow-lift xl:block">
                <p className="flex items-center gap-1.5 text-xs font-bold text-navy">
                  <ReceiptText className="h-3.5 w-3.5" /> Decision receipt sent
                </p>
                <p className="mt-0.5 text-[11px] text-muted">Explained · appealable</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Problem */}
      <Section className="py-16 sm:py-20">
        <h2 className="max-w-3xl text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">
          Communities break before they look broken.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <Card key={p.t} className="p-5">
              <h3 className="font-display text-base font-bold text-ink">{p.t}</h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted">{p.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Solution / pillars */}
      <div className="border-y border-border bg-surface">
        <Section className="py-16 sm:py-20">
          <h2 className="text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">
            Civitas turns trust problems into clear actions.
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-muted">
            Five pieces that detect trust fractures early and turn them into specific, doable repairs.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.t} className="p-6">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${p.chip}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.t}</h3>
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted">{p.d}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Walkthrough */}
      <Section className="py-16 sm:py-20">
        <h2 className="text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-border bg-surface p-5 shadow-card">
              <span className="font-display text-3xl font-extrabold text-primary/30">{s.n}</span>
              <h3 className="mt-2 font-display text-base font-bold text-ink">{s.t}</h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Niche first */}
      <div className="border-y border-border bg-ivory">
        <Section className="py-16 sm:py-20">
          <h2 className="text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">
            Built first for programming help communities.
          </h2>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
            Programming communities are where trust problems are easiest to see: vague questions, burned-out helpers,
            mocked beginners, repeated conflicts, and unclear moderation. Civitas starts there — then expands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {AUDIENCE.map((a) => (
              <span
                key={a}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink"
              >
                {a}
              </span>
            ))}
          </div>
        </Section>
      </div>

      {/* Not another moderation tool */}
      <Section className="py-16 sm:py-20">
        <h2 className="text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">
          Not another moderation tool.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              Traditional moderation
            </h3>
            <ul className="mt-4 space-y-2">
              {COMPARE.old.map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm text-muted">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rejected" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-primary/30 p-6">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-primary">Civitas</h3>
            <ul className="mt-4 space-y-2">
              {COMPARE.civitas.map((x) => (
                <li key={x} className="flex items-start gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Founder */}
      <Section className="py-16 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-balance font-display text-3xl font-extrabold text-navy sm:text-4xl">Why I built this</h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">
            Online communities are where people learn, build, organize, and belong — but most tools treat moderation as
            either a black box or an exhausting manual job. Civitas is an experiment in making trust visible, decisions
            understandable, and community governance usable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/case-study">
              <Button>Read the build case study</Button>
            </Link>
            <Link to="/about-builder">
              <Button variant="secondary">About the builder</Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-navy px-8 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-balance font-display text-3xl font-extrabold text-white sm:text-4xl">
              Explore Civitas as a live product experiment.
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={exploreDemo} loading={demo.isPending}>
                Open demo
              </Button>
              <a href={FOUNDER.githubRepo} target="_blank" rel="noreferrer">
                <Button size="lg" variant="secondary">
                  View on GitHub
                </Button>
              </a>
              <Link to="/case-study">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  Read case study
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
