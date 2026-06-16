import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { FOUNDER } from '@/config';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-2xl font-extrabold text-navy">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-pretty leading-relaxed text-ink/90">{children}</p>;
}

export function AboutBuilderPage() {
  return (
    <article className="mx-auto max-w-2xl py-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">About the builder</span>
      <h1 className="mt-2 text-balance font-display text-4xl font-extrabold leading-tight text-navy">
        Built by {FOUNDER.name}
      </h1>
      <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">
        A product experiment about trust, AI, and the future of online communities.
      </p>

      <H2>Why I built Civitas</H2>
      <P>
        I’ve watched good communities slowly fall apart — not because of one dramatic incident, but because trust eroded
        a little at a time. I wanted to see whether software could make that erosion visible and reversible.
      </P>

      <H2>The problem I saw</H2>
      <P>
        Moderation tools tend to be either black boxes or endless manual work. Members rarely understand why a decision
        was made, founders burn out, and the people who quietly hold a community together get no support. The missing
        layer isn’t more enforcement — it’s clarity.
      </P>

      <H2>Product principles</H2>
      <P>
        Help before punishment. Explain before enforcing. Make trust visible. Keep governance lightweight. Protect the
        people doing the work. Be honest about what the AI can and can’t do.
      </P>

      <H2>Technical architecture</H2>
      <P>
        Node/Express + a JSON API, a React/TypeScript/Vite/Tailwind SPA, TanStack Query for server state, a
        pattern-based moderation engine, and a multi-dimensional reputation system. SQLite for local development,
        Postgres for the public demo.
      </P>

      <H2>What I learned</H2>
      <P>
        The hardest part of community software isn’t detecting bad content — it’s communicating decisions in a way that
        keeps trust intact. That insight reshaped the whole product around explanation and fairness.
      </P>

      <H2>Roadmap</H2>
      <P>
        Real AI-provider integration, richer health insights, a weekly trust report, more templates, and portable
        community charters.
      </P>

      <H2>Get in touch</H2>
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap gap-3">
          <a href={FOUNDER.githubRepo} target="_blank" rel="noreferrer">
            <Button variant="secondary">GitHub</Button>
          </a>
          <a href={FOUNDER.linkedin} target="_blank" rel="noreferrer">
            <Button variant="secondary">LinkedIn</Button>
          </a>
          <a href={`mailto:${FOUNDER.email}`}>
            <Button variant="secondary">Email</Button>
          </a>
        </div>
      </Card>

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        Civitas is an independent product experiment by {FOUNDER.name}.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/case-study">
          <Button>Read the case study</Button>
        </Link>
        <Link to="/feed">
          <Button variant="secondary">Open the demo</Button>
        </Link>
      </div>
    </article>
  );
}
