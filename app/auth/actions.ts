'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Keeps post-login redirects on this site.
 *
 * `next` travels in a URL, so an attacker can mail out
 * /auth/login?next=https://evil.example and have a genuine login hand the user
 * straight to a phishing page — with the real domain in the referrer to make it
 * look legitimate. Only same-site absolute paths are honoured; "//evil.example"
 * and "https://…" are discarded rather than sanitised.
 */
function safeRedirectPath(value: unknown, fallback = '/account'): string {
  const path = typeof value === 'string' ? value : '';
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return fallback;
  }
  return path;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeRedirectPath(formData.get('next'));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '');

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/auth/check-email');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '');

  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  });

  // Always redirect to the same confirmation, whether or not the email
  // exists — don't leak which emails have accounts.
  redirect('/auth/check-email');
}
