import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { CURRENCY, SHIPPING_COUNTRIES } from '@/lib/config/locale';

interface CheckoutItem {
  productId: string;
  variantId: string | null;
  vendorId: string;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to check out.' }, { status: 401 });
  }

  const { items } = (await request.json()) as { items: CheckoutItem[] };
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your environment to enable checkout.' },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: items.map((item) => ({
        price_data: {
          currency: CURRENCY,
          product_data: { name: item.variantName ? `${item.name} — ${item.variantName}` : item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      metadata: {
        buyer_id: user.id,
        // Kept minimal: Stripe caps each metadata value at 500 characters, so
        // this only carries IDs/quantities — names are re-resolved server-side
        // from the DB when the webhook builds the order (also avoids trusting
        // client-supplied product names/prices).
        cart: JSON.stringify(items.map((i) => ({ p: i.productId, v: i.variantId, ven: i.vendorId, q: i.quantity, pr: i.price }))),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start checkout.';
    console.error('Checkout session error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
