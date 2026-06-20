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
        What if every decision came with a receipt?
      </h1>
      <p className="mt-4 text-pretty text-lg leading-relaxed text-muted">
        Civitas is built as a public demo around one question — and a thesis about how online trust should work in the
        AI age.
      </p>

      <H2>Why I built Civitas</H2>
      <P>
        I’ve watched good communities slowly fall apart — not because of one dramatic incident, but because trust eroded
        a little at a time: newcomers ignored, rules gone vague, helpers burned out, moderation that felt arbitrary, and
        people losing faith in the process before anyone noticed. I wanted to see whether software could make that
        erosion visible and reversible.
      </P>

      <H2>What the live demo is</H2>
      <P>
        The demo focuses on that concrete problem: a transparent, pattern-based trust layer for community governance —
        Trust Radar, Post Coach, Newcomer Rescue, Decision Receipts, and Weekly Trust Reports. It’s a prototype, honest
        about its limits, not production infrastructure.
      </P>

      <H2>The bigger thesis</H2>
      <P>
        The positioning is intentionally larger than the demo. Civitas points toward a future where trust isn’t asserted
        by authority alone, but earned through visible reasoning. The same receipt logic that explains a moderation
        decision could one day help explain a public claim, a financial interpretation, an ESG statement, or an
        AI-assisted recommendation. That broader direction is a roadmap and a portfolio thesis — not a claim that the
        current demo already solves every domain.
      </P>

      <H2>Builder positioning</H2>
      <P>
        This project is designed to support a trust-analyst positioning at the intersection of finance, media, policy,
        and technology. The thesis: misinformation isn’t only a content problem — it’s an economic, institutional, and
        governance problem. In a world where anything can look credible, the scarce resource isn’t more information; it’s
        legible, contestable reasoning. Civitas is the proof-of-work for that idea.
      </P>

      <H2>Principle</H2>
      <P>Help before punishment. Explain before enforcing. Make trust visible. Show the receipt.</P>

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
        Civitas is an independent product experiment by {FOUNDER.name}. The broader “Trust Receipts” direction is a
        proposed concept and portfolio thesis.
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
