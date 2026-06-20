import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { EmptyState, Spinner } from './ui';

export function QueryBoundary({
  isLoading,
  error,
  skeleton,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex justify-center py-20 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }
  if (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return <EmptyState title="Couldn't load this" hint={message} icon={<TriangleAlert className="h-6 w-6" />} />;
  }
  return <>{children}</>;
}
