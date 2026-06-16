import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg shadow-sm hover:shadow-glow hover:-translate-y-px',
  secondary: 'bg-surface text-ink border border-border hover:border-primary/40 hover:bg-panel',
  ghost: 'text-ink hover:bg-primary-soft/60',
  danger: 'bg-rejected text-white shadow-sm hover:-translate-y-px hover:shadow-lift',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-out-expo',
        'active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
});

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-card transition-all duration-300 ease-out-expo',
        className,
      )}
      {...rest}
    />
  );
}

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'neutral' | 'primary' | 'approved' | 'borderline' | 'rejected';
}) {
  // Darker foregrounds so small badge text clears AA (4.5:1) on the tinted fills.
  const tones = {
    neutral: 'bg-bg text-ink/70 border-border',
    primary: 'bg-primary-soft text-primary-strong border-transparent',
    approved: 'bg-approved/10 text-[#166534] border-transparent',
    borderline: 'bg-borderline/10 text-[#b45309] border-transparent',
    rejected: 'bg-rejected/10 text-[#b91c1c] border-transparent',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TagPill({ name }: { name: string }) {
  return <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-medium text-muted">#{name}</span>;
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-bold text-primary-strong"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  function Field({ label, id, className, ...rest }, ref) {
    return (
      <label className="block space-y-1.5" htmlFor={id}>
        {label && <span className="text-sm font-medium text-ink">{label}</span>}
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink',
            'transition-colors placeholder:text-muted focus:border-primary',
            className,
          )}
          {...rest}
        />
      </label>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(function Textarea({ label, id, className, ...rest }, ref) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <textarea
        id={id}
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink',
          'min-h-[120px] resize-y transition-colors placeholder:text-muted focus:border-primary',
          className,
        )}
        {...rest}
      />
    </label>
  );
});

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-panel', className)} />;
}

export function PostSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-5/6" />
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-panel text-muted">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}
