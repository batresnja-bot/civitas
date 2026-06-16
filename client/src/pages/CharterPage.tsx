import { Link, useParams } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { useConstitution } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui';

const SEVERITY: Record<string, { tone: 'rejected' | 'borderline' | 'neutral'; label: string }> = {
  critical: { tone: 'rejected', label: 'Protects most' },
  standard: { tone: 'borderline', label: 'Standard' },
  minor: { tone: 'neutral', label: 'Guidance' },
};

export function CharterPage() {
  const { slug = '' } = useParams();
  const con = useConstitution(slug);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/c/${slug}`} className="text-sm font-medium text-primary hover:underline">
        ← Back to community
      </Link>

      <QueryBoundary
        isLoading={con.isLoading}
        error={con.error}
        skeleton={
          <div className="mt-4 space-y-4">
            <Skeleton className="h-9 w-64" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-3 w-full" />
              </Card>
            ))}
          </div>
        }
      >
        {con.data && (
          <div className="mt-4">
            <header className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-teal">Community Charter</span>
              <h1 className="mt-1 text-balance font-display text-3xl font-extrabold text-navy">
                {con.data.community.name}
              </h1>
              <p className="mt-1 text-muted">
                What this community protects, and how decisions are made
                {con.data.constitution && <> · v{con.data.constitution.version}</>}
              </p>
              {con.data.community.purpose && (
                <p className="mt-3 max-w-prose text-pretty leading-relaxed text-ink/90">{con.data.community.purpose}</p>
              )}
            </header>

            {con.data.rules.length > 0 ? (
              <ol className="space-y-4">
                {con.data.rules.map((rule) => {
                  const sev = SEVERITY[rule.severity] ?? SEVERITY.minor;
                  return (
                    <li key={rule.id}>
                      <Card className="p-5">
                        <div className="flex items-start gap-4">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-panel font-display text-sm font-bold text-muted">
                            {rule.ruleNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-display text-lg font-bold text-ink">{rule.title}</h2>
                              <Badge tone={sev.tone}>{sev.label}</Badge>
                            </div>
                            <p className="mt-1.5 text-pretty leading-relaxed text-ink/90">{rule.summary}</p>
                            {rule.purpose && <p className="mt-2 text-sm text-muted">Why: {rule.purpose}</p>}
                          </div>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState
                title="No charter yet"
                hint="This community hasn’t written its charter."
                icon={<ScrollText className="h-6 w-6" />}
              />
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
