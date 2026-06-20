import { cn } from '@/lib/cn';

/**
 * The Civic Knot — three interlocking forms (conversation · protection · shared
 * trust) around a central dot. No gavel, no badge, no shield. Inherits color
 * from `currentColor`; the central dot uses the brand blue.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Civitas"
    >
      <g stroke="currentColor" strokeWidth="2.1" fill="none" strokeLinejoin="round">
        <circle cx="16" cy="11" r="6.4" />
        <circle cx="10.5" cy="20" r="6.4" />
        <circle cx="21.5" cy="20" r="6.4" />
      </g>
      <circle cx="16" cy="17" r="2.5" fill="rgb(var(--c-primary))" />
    </svg>
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Logo size={size} className="text-navy" />
      <span className="font-display text-xl font-extrabold tracking-tight text-navy">Civitas</span>
    </span>
  );
}
