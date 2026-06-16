import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, Siren, ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { HealthLabel as Health, NewcomerItem, TrustInsight } from '@/lib/types';
import { Avatar, Card } from './ui';

const HEALTH: Record<Health, string> = {
  Strong: 'bg-approved/10 text-[#166534]',
  Stable: 'bg-primary-soft text-primary-strong',
  'Needs attention': 'bg-borderline/10 text-[#b45309]',
  'At risk': 'bg-rejected/10 text-[#b91c1c]',
};

export function HealthLabel({ label }: { label: Health }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', HEALTH[label])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

const SEV: Record<string, { ring: string; Icon: LucideIcon; iconChip: string; chip: string }> = {
  info: { ring: 'border-border', Icon: Lightbulb, iconChip: 'bg-panel text-ink/70', chip: 'bg-panel text-ink/70' },
  warning: {
    ring: 'border-borderline/30',
    Icon: AlertTriangle,
    iconChip: 'bg-borderline/10 text-[#b45309]',
    chip: 'bg-borderline/10 text-[#b45309]',
  },
  serious: {
    ring: 'border-rejected/30',
    Icon: Siren,
    iconChip: 'bg-rejected/10 text-[#b91c1c]',
    chip: 'bg-rejected/10 text-[#b91c1c]',
  },
};

export function TrustInsightCard({ insight }: { insight: TrustInsight }) {
  const s = SEV[insight.severity] ?? SEV.info;
  return (
    <Card className={cn('p-5', s.ring)}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', s.iconChip)} aria-hidden>
          <s.Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-ink">{insight.title}</h3>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted">{insight.description}</p>
          {insight.evidence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {insight.evidence.map((e, i) => (
                <span key={i} className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', s.chip)}>
                  {e}
                </span>
              ))}
            </div>
          )}
          <Link
            to={insight.actionTo}
            className="group mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {insight.action}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function NewcomerRescueCard({ item }: { item: NewcomerItem }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <Avatar name={item.author.displayName} src={item.author.avatarUrl} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <p className="text-xs text-muted">
          {item.author.displayName} · waiting {item.hoursWaiting}h · {item.reason}
        </p>
      </div>
      <Link
        to={`/c/${item.slug}/p/${item.postId}`}
        className="shrink-0 rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:shadow-lift"
      >
        Welcome &amp; reply
      </Link>
    </Card>
  );
}
