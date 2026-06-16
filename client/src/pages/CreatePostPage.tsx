import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Ban, AlertTriangle, Lightbulb, type LucideIcon } from 'lucide-react';
import { previewCoach, useCommunity, useCommunityRules, useCreatePost } from '@/lib/queries';
import { Button, Card, Field, Textarea } from '@/components/ui';
import { ModerationResult } from '@/components/ModerationResult';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/cn';
import type { CoachResult } from '@/lib/types';

const EMPTY: CoachResult = { status: null, explanation: '', suggestions: [] };

const SUGGESTION_STYLE: Record<string, string> = {
  error: 'border-rejected/30 bg-rejected/5 text-[#b91c1c]',
  warning: 'border-borderline/30 bg-borderline/5 text-[#b45309]',
  info: 'border-border bg-panel/60 text-muted',
};
const SUGGESTION_ICON: Record<string, LucideIcon> = { error: Ban, warning: AlertTriangle, info: Lightbulb };

export function CreatePostPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const community = useCommunity(slug);
  const rules = useCommunityRules(slug);
  const createPost = useCreatePost(slug);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [coach, setCoach] = useState<CoachResult>(EMPTY);
  const [checking, setChecking] = useState(false);
  const seq = useRef(0);

  // Debounced Post Coach: live status + suggestions as you write.
  useEffect(() => {
    const text = content.trim();
    if (text.length < 3) {
      setCoach(EMPTY);
      setChecking(false);
      return;
    }
    setChecking(true);
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const result = await previewCoach(text, slug);
        if (id === seq.current) setCoach(result);
      } catch {
        /* best-effort */
      } finally {
        if (id === seq.current) setChecking(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [content, slug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const res = await createPost.mutateAsync({
        title: title.trim() || undefined,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });
      if (res.status === 'approved') {
        toast.show('Posted!', 'success');
        navigate(`/c/${slug}/p/${res.postId}`);
      } else {
        toast.show(
          res.status === 'pending' ? 'Sent to community review.' : 'Your post needs changes before it goes live.',
          'info',
        );
        navigate(`/c/${slug}`);
      }
    } catch {
      toast.show('Could not create post.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/c/${slug}`} className="text-sm font-medium text-primary hover:underline">
        ← {community.data?.name ?? 'Community'}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-navy">New post</h1>
      <p className="mt-1 text-muted">
        Post Coach helps you write a post that fits this community — before you publish.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Card className="space-y-4 p-6">
          <Field
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a clear title"
          />
          <Textarea
            label="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something useful, ask a question, start a discussion…"
            className="min-h-[180px]"
            required
          />
          <Field
            label="Tags (comma-separated, optional)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="feedback, ideas"
          />
        </Card>

        {/* Post Coach */}
        <section aria-label="Post Coach" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary-strong">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">Post Coach</h2>
          </div>
          <ModerationResult status={coach.status} explanation={coach.explanation} loading={checking} />
          {coach.suggestions.length > 0 && (
            <ul className="space-y-2">
              {coach.suggestions.map((s, i) => {
                const Icon = SUGGESTION_ICON[s.type] ?? Lightbulb;
                return (
                  <li
                    key={i}
                    className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', SUGGESTION_STYLE[s.type])}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-ink/90">
                      {s.message}
                      {s.rule && <span className="ml-1 text-muted">({s.rule})</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {rules.data && rules.data.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              What this community values
            </h2>
            <ul className="mt-3 space-y-2">
              {rules.data.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-semibold text-ink">{r.title}</span>
                  <span className="text-muted"> — {r.summary}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Link to={`/c/${slug}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg" loading={createPost.isPending} disabled={!content.trim()}>
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
}
