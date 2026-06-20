import { Link } from 'react-router-dom';
import type { PostSummary } from '@/lib/types';
import { relativeTime } from '@/lib/format';
import { Avatar, Card } from './ui';

export function PostCard({ post }: { post: PostSummary }) {
  const slug = post.communitySlug;
  const href = slug ? `/c/${slug}/p/${post.id}` : '#';
  return (
    <Card className="group p-5 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
      <Link to={href} className="block">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size={24} />
          <span className="font-medium text-ink">{post.author.displayName}</span>
          {post.communityName && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary-strong">
              {post.communityName}
            </span>
          )}
          <span aria-hidden>·</span>
          <span>{relativeTime(post.createdAt)}</span>
        </div>
        {post.title && (
          <h3 className="mt-2.5 text-balance font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary">
            {post.title}
          </h3>
        )}
        <p className="mt-1.5 line-clamp-3 text-pretty text-sm leading-relaxed text-ink/80">{post.content}</p>
      </Link>
    </Card>
  );
}
