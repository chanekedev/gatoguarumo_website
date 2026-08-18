import Link from 'next/link';
import { signIn } from '@/app/auth/actions';
import { buttonClasses } from '@/components/ui/button';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">Log in to your Gato Guarumo account.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
      )}

      <form action={signIn} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={searchParams.next ?? '/account'} />
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-xs font-semibold text-brand-green">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </div>
        <button type="submit" className={buttonClasses('primary', 'lg', 'w-full')}>
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New here?{' '}
        <Link href="/auth/register" className="font-semibold text-brand-green">
          Create an account
        </Link>
      </p>
    </main>
  );
}
