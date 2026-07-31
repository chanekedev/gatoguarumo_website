import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Link expired or invalid</h1>
      <p className="text-sm text-ink/60">That confirmation link didn't work. Try logging in, or request a new one.</p>
      <Link href="/auth/login" className="font-semibold text-brand-green">
        Back to login
      </Link>
    </main>
  );
}
