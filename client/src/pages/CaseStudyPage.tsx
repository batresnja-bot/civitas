import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { FOUNDER } from '@/config';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl font-extrabold text-navy">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-pretty leading-relaxed text-ink/90">{children}</p>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-pretty leading-relaxed text-ink/90">{children}</li>;
}

export function CaseStudyPage() {
  return (
    <article className="mx-auto max-w-2xl py-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">Case study</span>
      <h1 className="mt-2 text-balance font-display text-4xl font-extrabold leading-tight text-navy">
        Designing trust infrastructure for online communities
      </h1>
      <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">
        How Civitas approaches the real reason communities fall apart — not toxic content, but broken trust — and what a
        product that makes trust visible looks like.
      </p>

      <H2>The problem</H2>
      <P>
        Online communities are where people learn, build, organize, and belong. But as they grow, trust often breaks
        before the software does. Rules are unclear, decisions feel arbitrary, moderators burn out, newcomers get
        ignored, and there’s rarely a fair way to appeal.
      </P>

      <H2>Product thesis</H2>
      <P>
        Moderation alone isn’t enough. Communities need understandable rules, helpful participation guidance,
        transparent decisions, real appeals, and honest health feedback. The revolutionary part isn’t that Civitas has
        rules — it’s that it makes trust <em>visible</em>.
      </P>

      <H2>Why programming communities first</H2>
      <P>
        Programming help communities have clear, recurring trust problems: vague questions, mocked beginners, repeated
        answers, helper burnout, and unclear norms around criticism. They make the diagnosis concrete and demonstrable —
        so Civitas starts there before expanding to other serious communities.
      </P>

      <H2>The five product pillars</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <LI>
          <strong>Trust Radar</strong> — detects where trust is breaking now (ignored newcomers, ageing queues,
          confusing rules, drifting contributors) as insight cards with actions.
        </LI>
        <LI>
          <strong>Post Coach</strong> — community-aware help while writing, so posts get better answers instead of
          removed.
        </LI>
        <LI>
          <strong>Newcomer Rescue</strong> — surfaces first-time posters waiting for a reply, before they give up and
          leave.
        </LI>
        <LI>
          <strong>Decision Receipts</strong> — every decision explained: what happened, the norm, the reason, the
          reviewer, the appeal.
        </LI>
        <LI>
          <strong>Weekly Trust Report</strong> — what improved, what needs attention, and the few actions that matter
          next week.
        </LI>
      </ul>

      <H2>Design principles</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <LI>Help before punishment.</LI>
        <LI>Explain before enforcing.</LI>
        <LI>Make trust visible.</LI>
        <LI>Keep governance lightweight.</LI>
        <LI>Protect members and reviewers.</LI>
        <LI>Be honest about AI.</LI>
      </ul>

      <H2>Technical architecture</H2>
      <P>
        A Node/Express server exposes a JSON API and serves a React + TypeScript + Vite + Tailwind single-page app.
        TanStack Query manages server state; a small typed API client handles auth (session cookie) and CSRF. A
        pattern-based moderation engine scores posts against toxicity signals and each community’s rules, and a
        multi-dimensional reputation system drives trust levels. SQLite runs locally; Postgres is the target for the
        public demo deployment.
      </P>

      <H2>Tradeoffs</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <LI>
          Pattern-based screening instead of a full ML model for now — transparent and debuggable, intentionally not
          marketed as “real AI”.
        </LI>
        <LI>SQLite locally, Postgres for public deployment — simple dev start, real hosting later.</LI>
        <LI>Demo-first instead of enterprise-first — the goal is a clear, shareable product story.</LI>
        <LI>
          Governance depth balanced against everyday usability — members shouldn’t feel like they joined a legal system.
        </LI>
      </ul>

      <H2>What comes next</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <LI>Real AI-provider integration behind the same Post Coach interface.</LI>
        <LI>More community templates and charter examples.</LI>
        <LI>Richer health insights and a weekly trust report.</LI>
        <LI>Integrations and portable community charters.</LI>
      </ul>

      <H2>Contact</H2>
      <P>
        Civitas is an independent product experiment by {FOUNDER.name}.{' '}
        <a
          className="font-medium text-primary hover:underline"
          href={FOUNDER.githubRepo}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        {' · '}
        <a
          className="font-medium text-primary hover:underline"
          href={FOUNDER.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        {' · '}
        <a className="font-medium text-primary hover:underline" href={`mailto:${FOUNDER.email}`}>
          Email
        </a>
      </P>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link to="/">
          <Button>Back to home</Button>
        </Link>
        <Link to="/feed">
          <Button variant="secondary">Open the demo</Button>
        </Link>
      </div>
    </article>
  );
}
