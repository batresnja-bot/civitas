import { ReceiptText } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DecisionReceipt as Receipt } from '@/lib/types';
import { Card } from './ui';

const TONE: Record<string, { dot: string; label: string }> = {
  approved: { dot: 'bg-approved', label: 'Approved' },
  pending: { dot: 'bg-borderline', label: 'In review' },
  rejected: { dot: 'bg-rejected', label: 'Needs changes' },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-pretty text-sm leading-relaxed text-ink/90">{children}</dd>
    </div>
  );
}

/** A calm, transparent explanation of a moderation decision. */
export function DecisionReceiptCard({ receipt }: { receipt: Receipt }) {
  const tone = TONE[receipt.status] ?? TONE.pending;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-panel/60 px-5 py-3">
        <ReceiptText className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-display text-sm font-bold text-ink">Decision Receipt</span>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} aria-hidden />
          {tone.label}
        </span>
      </div>
      <dl className="px-5 pb-4">
        <Row label="What happened">{receipt.title}</Row>
        <Row label="Relevant norm">{receipt.relevantNorm}</Row>
        <Row label="Why">{receipt.reason}</Row>
        <Row label="Reviewed by">{receipt.reviewedBy}</Row>
        <Row label="What happens next">
          <ul className="list-disc space-y-1 pl-4">
            {receipt.nextSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Row>
        {receipt.expectedTime && <Row label="Expected time">{receipt.expectedTime}</Row>}
        <Row label="Appeal">
          {receipt.appealAvailable ? 'You can appeal after a final decision.' : 'No appeal needed.'}
        </Row>
      </dl>
    </Card>
  );
}
