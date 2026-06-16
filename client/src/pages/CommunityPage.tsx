import { Link, useParams } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { useCommunity, useCommunityPosts, useMe, useToggleMembership } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { PostCard } from '@/components/PostCard';
import { Button, Card, EmptyState, TagPill } from '@/components/ui';
import { useToast } from '@/components/Toast';

export function CommunityPage() {
  const { slug = '' } = useParams();
  const { data: me } = useMe();
  const community = useCommunity(slug);
  const posts = useCommunityPosts(slug);
  const membership = useToggleMembership(slug);
  const toast = useToast();

  const c = community.data;

  const onToggle = async () => {
    if (!c) return;
    try {
      await membership.mutateAsync(!c.isMember);
      toast.show(c.isMember ? `Left ${c.name}.` : `Joined ${c.name}!`, 'success');
    } catch {
      toast.show('Could not update membership.', 'error');
    }
  };

  return (
    <QueryBoundary isLoading={community.isLoading} error={community.error}>
      {c && (
        <div>
          <Card className="mb-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <h1 className="text-balance font-display text-3xl font-extrabold">{c.name}</h1>
                <p className="mt-2 max-w-prose text-pretty text-muted">{c.description || c.purpose}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span>
                    {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <Link to={`/c/${slug}/constitution`} className="font-medium text-primary hover:underline">
                    Read the charter
                  </Link>
                </div>
              </div>
              {me?.user && (
                <Button
                  variant={c.isMember ? 'secondary' : 'primary'}
                  onClick={onToggle}
                  loading={membership.isPending}
                  disabled={c.role === 'owner'}
                >
                  {c.role === 'owner' ? 'Owner' : c.isMember ? 'Leave' : 'Join'}
                </Button>
              )}
            </div>
            {c.topTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.topTags.map((t) => (
                  <TagPill key={t.id} name={t.name} />
                ))}
              </div>
            )}
          </Card>

          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Posts</h2>
            {me?.user && (
              <Link to={`/c/${slug}/new`}>
                <Button size="sm">New post</Button>
              </Link>
            )}
          </div>

          <QueryBoundary isLoading={posts.isLoading} error={posts.error}>
            {posts.data && posts.data.length > 0 ? (
              <div className="grid gap-4">
                {posts.data.map((post) => (
                  <PostCard key={post.id} post={{ ...post, communitySlug: slug, communityName: c.name }} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No posts yet"
                hint="Start the first conversation in this community."
                icon={<PenLine className="h-6 w-6" />}
              />
            )}
          </QueryBoundary>
        </div>
      )}
    </QueryBoundary>
  );
}
