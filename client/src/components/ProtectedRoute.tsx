import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useMe } from '@/lib/queries';
import { Spinner } from './ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (!me?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
