export function relativeTime(iso: string): string {
  const then = new Date(
    iso.includes('T') || iso.includes(' ') ? iso.replace(' ', 'T') + (iso.endsWith('Z') ? '' : 'Z') : iso,
  ).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

import { ThumbsUp, Lightbulb, FileText, Wrench, Check, type LucideIcon } from 'lucide-react';

export const REACTIONS: { type: string; label: string; Icon: LucideIcon }[] = [
  { type: 'helpful', label: 'Helpful', Icon: ThumbsUp },
  { type: 'insightful', label: 'Insightful', Icon: Lightbulb },
  { type: 'well_explained', label: 'Well explained', Icon: FileText },
  { type: 'constructive', label: 'Constructive', Icon: Wrench },
  { type: 'agree', label: 'Agree', Icon: Check },
];

export function reactionLabel(type: string): string {
  return REACTIONS.find((r) => r.type === type)?.label ?? type;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
