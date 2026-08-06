import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
  }

  const { data: vendor } = await supabase.from('vendors').select('id, stripe_account_id').eq('owner_id', user.id).maybeSingle();
  if (!vendor) {
    return NextResponse.json({ error: 'No vendor store linked to this account.' }, { status: 404 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your environment.' },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let accountId = vendor.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await supabase.from('vendors').update({ stripe_account_id: accountId }).eq('id', vendor.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/vendor/dashboard?stripe=refresh`,
    return_url: `${siteUrl}/vendor/dashboard?stripe=return`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
