import { useNavigate } from 'react-router-dom';
import { useDemoLogin, useMe } from '@/lib/queries';
import { useToast } from './Toast';
import { Button } from './ui';
import type { DemoRole } from '@/lib/types';

const ROLES: { role: DemoRole; label: string; blurb: string }[] = [
  { role: 'founder', label: 'View as Founder', blurb: 'Charter, trust dashboard, health' },
  { role: 'member', label: 'View as Member', blurb: 'Post, reply, react, get coached' },
  { role: 'reviewer', label: 'View as Reviewer', blurb: 'Help decide borderline cases' },
];

export function DemoButtons({ variant = 'card' }: { variant?: 'card' | 'inline' }) {
  const demo = useDemoLogin();
  const navigate = useNavigate();
  const toast = useToast();

  const DEST: Record<DemoRole, string> = { founder: '/radar', member: '/feed', reviewer: '/feed' };
  const enter = async (role: DemoRole) => {
    try {
      await demo.mutateAsync(role);
      navigate(DEST[role]);
    } catch {
      toast.show('Demo sign-in failed.', 'error');
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <Button key={r.role} variant="secondary" size="sm" onClick={() => enter(r.role)} loading={demo.isPending}>
            {r.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ROLES.map((r) => (
        <button
          key={r.role}
          onClick={() => enter(r.role)}
          disabled={demo.isPending}
          className="group rounded-xl border border-border bg-surface p-4 text-left shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift disabled:opacity-60"
        >
          <div className="font-display text-sm font-bold text-ink group-hover:text-primary">{r.label}</div>
          <div className="mt-1 text-xs text-muted">{r.blurb}</div>
        </button>
      ))}
    </div>
  );
}

/** Thin top banner shown whenever the app runs in demo mode. */
export function DemoBanner() {
  const { data: me } = useMe();
  if (!me?.demo) return null;
  return (
    <div className="bg-navy px-4 py-2 text-center text-xs font-medium text-white/90">
      You're viewing a public demo of Civitas — data may reset periodically. Use the role switcher to explore.
    </div>
  );
}
