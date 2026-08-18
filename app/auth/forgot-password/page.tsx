import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';
import { buttonClasses } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink/60">We'll email you a link to set a new one.</p>

      <form action={requestPasswordReset} className="mt-6 space-y-4">
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
        <button type="submit" className={buttonClasses('primary', 'lg', 'w-full')}>
          Send reset link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        <Link href="/auth/login" className="font-semibold text-brand-green">
          Back to login
        </Link>
      </p>
    </main>
  );
}
