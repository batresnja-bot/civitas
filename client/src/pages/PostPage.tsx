import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAddComment, useBookmark, useMe, usePost, useReact, useReceipt } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { DecisionReceiptCard } from '@/components/DecisionReceipt';
import { Avatar, Button, Card, TagPill, Textarea } from '@/components/ui';
import { TrustBadge } from '@/components/TrustBadge';
import { useToast } from '@/components/Toast';
import { REACTIONS, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

export function PostPage() {
  const { slug = '', id = '' } = useParams();
  const { data: me } = useMe();
  const post = usePost(slug, id);
  const react = useReact(slug, id);
  const bookmark = useBookmark(slug, id);
  const addComment = useAddComment(slug, id);
  const receipt = useReceipt(slug, id);
  const toast = useToast();
  const [comment, setComment] = useState('');

  const d = post.data;
  const countFor = (type: string) => d?.reactions.find((r) => r.type === type)?.count ?? 0;

  const onComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await addComment.mutateAsync(comment.trim());
      setComment('');
      toast.show(res.status === 'approved' ? 'Comment posted.' : 'Comment sent for review.', 'success');
    } catch {
      toast.show('Could not post comment.', 'error');
    }
  };

  return (
    <QueryBoundary isLoading={post.isLoading} error={post.error}>
      {d && (
        <div className="mx-auto max-w-2xl">
          <Link to={`/c/${slug}`} className="text-sm font-medium text-primary hover:underline">
            ← Back to community
          </Link>

          <Card className="mt-4 p-6">
            <div className="flex items-center gap-3">
              <Avatar name={d.post.author.displayName} src={d.post.author.avatarUrl} size={44} />
              <div>
                <div className="flex items-center gap-2">
                  <Link to={`/u/${d.post.author.username}`} className="font-semibold text-ink hover:text-primary">
                    {d.post.author.displayName}
                  </Link>
                  {d.post.author.trust && (
                    <TrustBadge level={d.post.author.trustLevel ?? 0} name={d.post.author.trust.name} />
                  )}
                </div>
                <span className="text-xs text-muted">{relativeTime(d.post.createdAt)}</span>
              </div>
            </div>

            {d.post.title && (
              <h1 className="mt-4 text-balance font-display text-2xl font-extrabold leading-tight">{d.post.title}</h1>
            )}
            <p className="mt-3 max-w-prose whitespace-pre-wrap text-pretty leading-relaxed text-ink/90">
              {d.post.content}
            </p>

            {d.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {d.tags.map((t) => (
                  <TagPill key={t.id} name={t.name} />
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              {REACTIONS.map((r) => {
                const active = d.userReaction === r.type;
                const Icon = r.Icon;
                return (
                  <button
                    key={r.type}
                    type="button"
                    disabled={!me?.user || react.isPending}
                    onClick={() => react.mutate(r.type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-50',
                      active
                        ? 'border-primary bg-primary-soft text-primary-strong'
                        : 'border-border text-muted hover:text-ink',
                    )}
                    title={r.label}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {countFor(r.type) > 0 && <span className="font-medium">{countFor(r.type)}</span>}
                  </button>
                );
              })}
              {me?.user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => bookmark.mutate()}
                  loading={bookmark.isPending}
                >
                  {d.bookmarked ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {d.post.status !== 'approved' && receipt.data && (
            <div className="mt-6">
              <DecisionReceiptCard receipt={receipt.data} />
            </div>
          )}

          <section className="mt-8">
            <h2 className="mb-4 font-display text-lg font-bold">
              {d.comments.length} {d.comments.length === 1 ? 'comment' : 'comments'}
            </h2>

            {me?.user ? (
              <form onSubmit={onComment} className="mb-6 space-y-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a thoughtful comment…"
                  className="min-h-[90px]"
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={addComment.isPending} disabled={!comment.trim()}>
                    Comment
                  </Button>
                </div>
              </form>
            ) : (
              <Card className="mb-6 p-4 text-sm text-muted">
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>{' '}
                to join the conversation.
              </Card>
            )}

            <div className="space-y-4">
              {d.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author.displayName} src={c.author.avatarUrl} size={32} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-ink">{c.author.displayName}</span>
                      <span className="text-xs text-muted">{relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </QueryBoundary>
  );
}
