import { useParams } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { useProfile } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { PostCard } from '@/components/PostCard';
import { Avatar, Card, EmptyState, Skeleton } from '@/components/ui';
import { TrustBadge } from '@/components/TrustBadge';
import { relativeTime } from '@/lib/format';

function ReputationBars({ dimensions, total }: { dimensions: { dimension: string; score: number }[]; total: number }) {
  const max = Math.max(10, ...dimensions.map((d) => d.score));
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">Reputation</h2>
        <span className="font-display text-2xl font-extrabold text-ink">{total}</span>
      </div>
      {dimensions.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {dimensions.map((d) => (
            <li key={d.dimension}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-ink">{d.dimension}</span>
                <span className="tabular-nums text-muted">{Math.round(d.score)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (d.score / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No reputation earned yet — contribute to build trust.</p>
      )}
    </Card>
  );
}

export function ProfilePage() {
  const { username = '' } = useParams();
  const profile = useProfile(username);

  return (
    <QueryBoundary
      isLoading={profile.isLoading}
      error={profile.error}
      skeleton={
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          </div>
        </Card>
      }
    >
      {profile.data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="order-2 lg:order-1">
            <h2 className="mb-4 font-display text-xl font-bold">Posts</h2>
            {profile.data.posts.length > 0 ? (
              <div className="grid gap-4">
                {profile.data.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No posts yet"
                hint={`${profile.data.user.displayName} hasn't posted publicly.`}
                icon={<Inbox className="h-6 w-6" />}
              />
            )}
          </div>

          <aside className="order-1 space-y-6 lg:order-2">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Avatar name={profile.data.user.displayName} src={profile.data.user.avatarUrl} size={64} />
                <div className="min-w-0">
                  <h1 className="truncate font-display text-2xl font-extrabold">{profile.data.user.displayName}</h1>
                  <p className="text-sm text-muted">@{profile.data.user.username}</p>
                </div>
              </div>
              <div className="mt-4">
                <TrustBadge level={profile.data.user.trustLevel} name={profile.data.user.trust?.name} />
              </div>
              {profile.data.user.bio && (
                <p className="mt-4 text-pretty text-sm leading-relaxed text-ink/90">{profile.data.user.bio}</p>
              )}
              <p className="mt-4 text-xs text-muted">Joined {relativeTime(profile.data.user.joinedAt)}</p>
            </Card>

            <ReputationBars dimensions={profile.data.dimensions} total={profile.data.user.reputation} />
          </aside>
        </div>
      )}
    </QueryBoundary>
  );
}
