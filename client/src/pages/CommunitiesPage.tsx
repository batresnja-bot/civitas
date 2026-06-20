import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  Code2,
  GraduationCap,
  FlaskConical,
  Megaphone,
  Users,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useCommunities } from '@/lib/queries';
import { QueryBoundary } from '@/components/QueryBoundary';
import { Card, EmptyState, Skeleton } from '@/components/ui';

// A small, deterministic accent per community so the list reads as distinct
// places rather than an identical card grid.
const ACCENTS: LucideIcon[] = [Landmark, Code2, Wrench, GraduationCap, FlaskConical, Megaphone, Users, Sparkles];
function accentFor(slug: string): LucideIcon {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

export function CommunitiesPage() {
  const communities = useCommunities();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-balance font-display text-3xl font-extrabold">Communities</h1>
        <p className="mt-1 max-w-prose text-pretty text-muted">
          Each one runs on its own constitution and review process.
        </p>
      </div>

      <QueryBoundary
        isLoading={communities.isLoading}
        error={communities.error}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
              </Card>
            ))}
          </div>
        }
      >
        {communities.data && communities.data.length > 0 ? (
          <div className="stagger grid gap-4 sm:grid-cols-2">
            {communities.data.map((c, i) => {
              const Icon = accentFor(c.slug);
              return (
              <Link key={c.id} to={`/c/${c.slug}`} className="group block" style={{ ['--i']: i } as CSSProperties}>
                <Card className="flex h-full gap-4 p-5 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lift">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-display text-lg font-bold text-ink group-hover:text-primary">
                        {c.name}
                      </h2>
                      <span className="shrink-0 text-xs font-medium text-muted">
                        {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-pretty text-sm text-muted">
                      {c.description || c.purpose || 'A Civitas community.'}
                    </p>
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No communities yet"
            hint="Communities will appear here once they're created."
            icon={<Landmark className="h-6 w-6" />}
          />
        )}
      </QueryBoundary>
    </div>
  );
}
