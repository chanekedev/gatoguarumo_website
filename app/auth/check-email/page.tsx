import { Mail } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <Mail className="h-10 w-10 text-brand-green" />
      <h1 className="font-display text-2xl font-bold text-ink">Check your email</h1>
      <p className="text-sm text-ink/60">
        If an account exists for that email, we sent a link — click it to continue.
      </p>
    </main>
  );
}
