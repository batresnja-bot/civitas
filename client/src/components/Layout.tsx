import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe, useLogout } from '@/lib/queries';
import { useToast } from './Toast';
import { DemoBanner } from './DemoControls';
import { Avatar, Button } from './ui';
import { TrustBadge } from './TrustBadge';
import { Wordmark } from './Logo';
import { FOUNDER } from '@/config';
import { cn } from '@/lib/cn';

const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-soft text-primary-strong' : 'text-muted hover:bg-panel hover:text-ink',
  );

export function Layout() {
  const { data: me } = useMe();
  const logout = useLogout();
  const toast = useToast();
  const navigate = useNavigate();
  const user = me?.user;

  const onLogout = async () => {
    await logout.mutateAsync();
    toast.show('Signed out.', 'success');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <Link to="/" aria-label="Civitas home">
            <Wordmark />
          </Link>
          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <NavLink to="/feed" className={navLink}>
              Feed
            </NavLink>
            <NavLink to="/c" className={navLink}>
              Communities
            </NavLink>
            {user && (
              <>
                <NavLink to="/radar" className={navLink}>
                  Trust Radar
                </NavLink>
                <NavLink to="/dashboard" className={navLink}>
                  Dashboard
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <Link to={`/u/${user.username}`} className="hidden items-center gap-2 sm:flex">
                  <TrustBadge level={user.trustLevel} name={user.trust?.name} />
                  <Avatar name={user.displayName} src={user.avatarUrl} size={32} />
                </Link>
                <Button variant="ghost" size="sm" onClick={onLogout} loading={logout.isPending}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Join Civitas</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Wordmark size={22} />
            <p className="mt-2 max-w-sm text-pretty">
              Trust infrastructure for serious online communities. An independent product experiment by {FOUNDER.name}.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/case-study" className="hover:text-ink">
              Case study
            </Link>
            <Link to="/about-builder" className="hover:text-ink">
              About the builder
            </Link>
            <a href={FOUNDER.githubRepo} target="_blank" rel="noreferrer" className="hover:text-ink">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
