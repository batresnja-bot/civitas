import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import { useFeed } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { PostCard } from '@/components/PostCard';
import { EmptyState, PostSkeleton } from '@/components/ui';

export function FeedPage() {
  const feed = useFeed();

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-extrabold text-navy">Recent across Civitas</h1>
        <Link to="/c" className="text-sm font-medium text-primary hover:underline">
          All communities
        </Link>
      </div>

      <QueryBoundary
        isLoading={feed.isLoading}
        error={feed.error}
        skeleton={
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        }
      >
        {feed.data && feed.data.length > 0 ? (
          <div className="stagger grid gap-4">
            {feed.data.map((post, i) => (
              <div key={post.id} style={{ ['--i']: i } as CSSProperties}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing here yet"
            hint="Be the first to start a conversation in a community."
            icon={<MessageSquarePlus className="h-6 w-6" />}
          />
        )}
      </QueryBoundary>
    </div>
  );
}
