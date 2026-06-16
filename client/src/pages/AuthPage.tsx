import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLogin, useMe, useRegister } from '@/lib/queries';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { DemoButtons } from '@/components/DemoControls';
import { Button, Card, Field } from '@/components/ui';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';
  const login = useLogin();
  const register = useRegister();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { data: me } = useMe();

  const from = (location.state as { from?: string } | null)?.from || '/feed';

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (isLogin) {
        await login.mutateAsync({
          login: String(form.get('login') || ''),
          password: String(form.get('password') || ''),
        });
        toast.show('Welcome back!', 'success');
      } else {
        await register.mutateAsync({
          username: String(form.get('username') || ''),
          email: String(form.get('email') || ''),
          password: String(form.get('password') || ''),
          displayName: String(form.get('displayName') || '') || undefined,
        });
        toast.show('Account created. Welcome to Civitas!', 'success');
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  const pending = login.isPending || register.isPending;

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold">{isLogin ? 'Welcome back' : 'Join Civitas'}</h1>
        <p className="mt-2 text-muted">
          {isLogin
            ? 'Sign in to take part in community governance.'
            : 'Create an account to post, react, and help govern.'}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {isLogin ? (
            <Field name="login" label="Username or email" autoComplete="username" required />
          ) : (
            <>
              <Field name="username" label="Username" autoComplete="username" required minLength={3} maxLength={30} />
              <Field name="email" label="Email" type="email" autoComplete="email" required />
              <Field name="displayName" label="Display name (optional)" />
            </>
          )}
          <Field
            name="password"
            label="Password"
            type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={isLogin ? undefined : 8}
          />

          {error && <p className="rounded-lg bg-rejected/10 px-3 py-2 text-sm text-rejected">{error}</p>}

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {isLogin ? 'Log in' : 'Create account'}
          </Button>
        </form>
      </Card>

      {me?.demo && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-border" /> Or explore instantly <span className="h-px flex-1 bg-border" />
          </div>
          <DemoButtons />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? (
          <>
            New here?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already a member?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
