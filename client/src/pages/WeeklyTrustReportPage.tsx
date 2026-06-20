import { Link } from 'react-router-dom';
import { useTrustReport } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { HealthLabel } from '@/components/Trust';
import { Card, Skeleton } from '@/components/ui';

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 text-center">
      <div className="font-display text-3xl font-extrabold text-navy">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </Card>
  );
}

export function WeeklyTrustReportPage() {
  const report = useTrustReport();

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/radar" className="text-sm font-medium text-primary hover:underline">
        ← Trust Radar
      </Link>
      <QueryBoundary
        isLoading={report.isLoading}
        error={report.error}
        skeleton={<Skeleton className="mt-4 h-64 w-full" />}
      >
        {report.data && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">Weekly trust report</span>
                <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">{report.data.community.name}</h1>
                <p className="mt-1 text-muted">Week of {report.data.weekOf}</p>
              </div>
              <HealthLabel label={report.data.healthLabel} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="New posts" value={report.data.metrics.newPosts} />
              <Metric label="Helpful answers" value={report.data.metrics.helpfulAnswers} />
              <Metric label="Newcomers" value={report.data.metrics.newMembers} />
              <Metric label="Open cases" value={report.data.metrics.openCases} />
            </div>

            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-navy">What improved</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
                {report.data.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h2 className="font-display text-lg font-bold text-navy">What needs attention</h2>
              {report.data.risks.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
                  {report.data.risks.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Nothing pressing this week.</p>
              )}
            </section>

            {report.data.recommendedActions.length > 0 && (
              <section className="mt-6">
                <h2 className="font-display text-lg font-bold text-navy">Recommended actions for next week</h2>
                <ol className="mt-2 space-y-2">
                  {report.data.recommendedActions.map((a, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-ink">
                        <strong>{a.title}</strong> <span className="text-muted">— {a.why}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <p className="mt-8 rounded-lg bg-panel/60 px-4 py-3 text-xs text-muted">
              Signals are computed live from this community’s activity. This report is in-app today; email + markdown
              export are on the roadmap.
            </p>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
