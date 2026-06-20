import { Link } from 'react-router-dom';
import { Compass, Construction } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="py-16">
      <EmptyState
        title="Page not found"
        hint="The page you're looking for doesn't exist."
        icon={<Compass className="h-6 w-6" />}
      />
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button>Back to feed</Button>
        </Link>
      </div>
    </div>
  );
}

// Placeholder for pages slated for a later pass (profiles, constitution,
// proposals, etc.) so existing links resolve gracefully.
export function ComingSoonPage() {
  return (
    <div className="py-16">
      <EmptyState
        title="Coming soon"
        hint="This part of Civitas is being rebuilt in the new interface. It's available in the classic view in the meantime."
        icon={<Construction className="h-6 w-6" />}
      />
      <div className="mt-6 flex justify-center">
        <Link to="/">
          <Button variant="secondary">Back to feed</Button>
        </Link>
      </div>
    </div>
  );
}
