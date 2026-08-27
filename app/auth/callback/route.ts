import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handles the redirect back from Supabase email/OAuth links, exchanging the
// auth code for a session cookie before sending the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Same-site paths only: this value comes from a link in an email, so an
  // attacker-supplied "//evil.example" must not become the post-login landing.
  const requestedNext = searchParams.get('next') ?? '/';
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.startsWith('/\\')
      ? requestedNext
      : '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
