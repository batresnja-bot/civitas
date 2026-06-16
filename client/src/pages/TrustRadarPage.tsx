import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useTrustRadar } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { HealthLabel, NewcomerRescueCard, TrustInsightCard } from '@/components/Trust';
import { Card, EmptyState, Skeleton } from '@/components/ui';

export function TrustRadarPage() {
  const radar = useTrustRadar();

  return (
    <QueryBoundary
      isLoading={radar.isLoading}
      error={radar.error}
      skeleton={
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-3 w-full" />
              </Card>
            ))}
          </div>
        </div>
      }
    >
      {radar.data && (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Trust Radar</span>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">{radar.data.community.name}</h1>
              <p className="mt-1 text-muted">Where trust is breaking right now — and what to do about it.</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <HealthLabel label={radar.data.healthLabel} />
              <Link to="/report" className="text-sm font-medium text-primary hover:underline">
                Weekly trust report →
              </Link>
            </div>
          </div>

          {radar.data.recommendedActions.length > 0 && (
            <Card className="mb-6 border-primary/20 bg-primary-soft/40 p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-primary">
                This week’s recommended actions
              </h2>
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {radar.data.recommendedActions.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {a}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {radar.data.insights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {radar.data.insights.map((insight, i) => (
                <TrustInsightCard key={i} insight={insight} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Trust looks healthy"
              hint="No fractures detected right now. Civitas will flag issues as they emerge."
              icon={<ShieldCheck className="h-6 w-6" />}
            />
          )}

          {radar.data.newcomers.length > 0 && (
            <section id="newcomers" className="mt-10 scroll-mt-20">
              <h2 className="mb-4 font-display text-xl font-bold text-navy">Newcomer Rescue</h2>
              <p className="mb-4 text-sm text-muted">
                First-time posters waiting for a reply. A quick, kind response makes them far more likely to stay.
              </p>
              <div className="grid gap-3">
                {radar.data.newcomers.map((n) => (
                  <NewcomerRescueCard key={n.postId} item={n} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}

export function TrustRadarEmpty() {
  return (
    <EmptyState
      title="No community to diagnose yet"
      hint="Trust Radar appears once you create or manage a community."
      icon="📡"
    />
  );
}
