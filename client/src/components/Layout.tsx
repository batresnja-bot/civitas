import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
    isActive ? 'bg-primary-soft text-primary-strong' : 'text-ink hover:bg-panel',
  );

export function Layout() {
  const { data: me } = useMe();
  const logout = useLogout();
  const toast = useToast();
  const navigate = useNavigate();
  const user = me?.user;
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    setMenuOpen(false);
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
            {/* desktop auth */}
            <div className="hidden items-center gap-3 sm:flex">
              {user ? (
                <>
                  <Link to={`/u/${user.username}`} className="flex items-center gap-2">
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

            {/* mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink hover:bg-panel sm:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile menu panel */}
        {menuOpen && (
          <div className="animate-fade-up border-t border-border bg-bg sm:hidden">
            <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3" onClick={() => setMenuOpen(false)}>
              <NavLink to="/feed" className={mobileLink}>
                Feed
              </NavLink>
              <NavLink to="/c" className={mobileLink}>
                Communities
              </NavLink>
              {user && (
                <>
                  <NavLink to="/radar" className={mobileLink}>
                    Trust Radar
                  </NavLink>
                  <NavLink to="/dashboard" className={mobileLink}>
                    Dashboard
                  </NavLink>
                  <NavLink to={`/u/${user.username}`} className={mobileLink}>
                    Profile
                  </NavLink>
                </>
              )}
              <div className="mt-2 border-t border-border pt-3">
                {user ? (
                  <Button variant="secondary" className="w-full" onClick={onLogout} loading={logout.isPending}>
                    Sign out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login">
                      <Button variant="secondary" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button className="w-full">Join Civitas</Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
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
