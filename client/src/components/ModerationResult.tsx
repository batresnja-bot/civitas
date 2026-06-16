import { Check, Clock, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ModerationStatus } from '@/lib/types';

const CONFIG: Record<ModerationStatus, { label: string; blurb: string; Icon: LucideIcon; cls: string; iconChip: string }> = {
  approved: {
    label: 'Looks good',
    blurb: 'This follows the community guidelines and will publish immediately.',
    Icon: Check,
    cls: 'border-approved/30 bg-approved/5 text-[#166534]',
    iconChip: 'bg-approved/15 text-[#166534]',
  },
  borderline: {
    label: 'Needs review',
    blurb: 'This will be sent to community reviewers before it goes live.',
    Icon: Clock,
    cls: 'border-borderline/30 bg-borderline/5 text-[#b45309]',
    iconChip: 'bg-borderline/15 text-[#b45309]',
  },
  rejected: {
    label: 'Likely to be held',
    blurb: 'This may violate community rules. You can edit it or appeal after posting.',
    Icon: X,
    cls: 'border-rejected/30 bg-rejected/5 text-[#b91c1c]',
    iconChip: 'bg-rejected/15 text-[#b91c1c]',
  },
};

/**
 * Civitas's signature surface: a live read on how the moderation engine sees a
 * draft. `status === null` renders an idle/neutral prompt.
 */
export function ModerationResult({
  status,
  explanation,
  loading,
}: {
  status: ModerationStatus | null;
  explanation?: string;
  loading?: boolean;
}) {
  if (!status) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-bg/50 px-4 py-3 text-sm text-muted">
        <span className="font-medium text-ink">AI screening.</span> Start writing and we'll check your post against the
        community's constitution in real time.
      </div>
    );
  }

  const c = CONFIG[status];
  return (
    <div className={cn('animate-fade-up rounded-xl border px-4 py-3 transition-colors', c.cls)}>
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full', c.iconChip)}>
          <c.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span className="font-display text-sm font-bold">{c.label}</span>
        {loading && <span className="text-xs font-normal opacity-70">checking…</span>}
      </div>
      <p className="mt-1.5 text-sm text-ink/80">{explanation || c.blurb}</p>
    </div>
  );
}
