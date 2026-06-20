import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useDashboard } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui';
import { TrustBadge } from '@/components/TrustBadge';
import { relativeTime } from '@/lib/format';

const STATUS_TONE: Record<string, 'approved' | 'borderline' | 'rejected' | 'neutral'> = {
  approved: 'approved',
  pending: 'borderline',
  rejected: 'rejected',
};
const STATUS_LABEL: Record<string, string> = { approved: 'Live', pending: 'In review', rejected: 'Held' };

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className={`font-display text-3xl font-extrabold ${tone ?? 'text-ink'}`}>{value}</div>
      <div className="mt-0.5 text-sm text-muted">{label}</div>
    </Card>
  );
}

export function DashboardPage() {
  const dash = useDashboard();

  return (
    <div>
      <QueryBoundary
        isLoading={dash.isLoading}
        error={dash.error}
        skeleton={
          <div>
            <Skeleton className="h-9 w-56" />
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="mt-2 h-3 w-16" />
                </Card>
              ))}
            </div>
          </div>
        }
      >
        {dash.data && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-balance font-display text-3xl font-extrabold">Your dashboard</h1>
                <p className="mt-1 text-muted">Welcome back, {dash.data.user.displayName}.</p>
              </div>
              <TrustBadge level={dash.data.user.trustLevel} name={dash.data.user.trust?.name} />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Posts" value={dash.data.stats.total} />
              <Stat label="Live" value={dash.data.stats.approved} tone="text-[#166534]" />
              <Stat label="In review" value={dash.data.stats.pending} tone="text-[#b45309]" />
              <Stat label="Held" value={dash.data.stats.rejected} tone="text-[#b91c1c]" />
            </div>

            <h2 className="mb-4 mt-8 font-display text-xl font-bold">Your posts</h2>
            {dash.data.posts.length > 0 ? (
              <Card className="divide-y divide-border overflow-hidden">
                {dash.data.posts.map((p) => {
                  const linkable = !!p.communitySlug;
                  const inner = (
                    <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-panel/60">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.title || p.content.slice(0, 60)}</p>
                        <p className="text-xs text-muted">
                          {p.communityName} · {relativeTime(p.createdAt)}
                          {p.status !== 'approved' && ' · view decision receipt'}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
                    </div>
                  );
                  return linkable ? (
                    <Link key={p.id} to={`/c/${p.communitySlug}/p/${p.id}`} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={p.id}>{inner}</div>
                  );
                })}
              </Card>
            ) : (
              <EmptyState
                title="No posts yet"
                hint="Join a community and share your first post."
                icon={<PenLine className="h-6 w-6" />}
              />
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
