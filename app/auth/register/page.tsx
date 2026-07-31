import Link from 'next/link';
import { signUp } from '@/app/auth/actions';
import { buttonClasses } from '@/components/ui/button';

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Join the crew</h1>
      <p className="mt-1 text-sm text-ink/60">Create an account to shop and track orders.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{searchParams.error}</p>
      )}

      <form action={signUp} className="mt-6 space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </div>
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
        </div>
        <button type="submit" className={buttonClasses('primary', 'lg', 'w-full')}>
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-brand-green">
          Log in
        </Link>
      </p>
    </main>
  );
}
