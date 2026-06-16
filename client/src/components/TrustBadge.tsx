import { Sprout, Leaf, Star, Shield, Landmark, Crown, type LucideIcon } from 'lucide-react';
import { Badge } from './ui';

const ICONS: LucideIcon[] = [Sprout, Leaf, Star, Shield, Landmark, Crown];

export function TrustBadge({ level, name }: { level: number; name?: string }) {
  const Icon = ICONS[level] ?? Sprout;
  return (
    <Badge tone={level >= 3 ? 'primary' : 'neutral'} className="font-semibold">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {name ?? `Level ${level}`}
    </Badge>
  );
}
