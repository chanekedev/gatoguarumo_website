import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { priceCart, type CartRequestItem } from '@/lib/queries/cart-pricing';
import { CURRENCY, SHIPPING_COUNTRIES } from '@/lib/config/locale';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to check out.' }, { status: 401 });
  }

  let requested: CartRequestItem[];
  try {
    const body = (await request.json()) as { items?: CartRequestItem[] };
    requested = body.items ?? [];
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
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

  // Prices, names and vendor ownership come from the database — never from the
  // request body, which the shopper controls.
  let lines;
  try {
    lines = await priceCart(requested);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not price your cart.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: lines.map((line) => ({
        price_data: {
          currency: CURRENCY,
          product_data: { name: line.variantName ? `${line.name} — ${line.variantName}` : line.name },
          unit_amount: Math.round(line.unitPrice * 100),
        },
        quantity: line.quantity,
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      metadata: {
        buyer_id: user.id,
        // Only ids and quantities travel through Stripe (values are capped at
        // 500 characters anyway). The webhook re-prices from the database, so
        // even this round-trip is not trusted for money.
        cart: JSON.stringify(lines.map((l) => ({ p: l.productId, v: l.variantId, q: l.quantity }))),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start checkout.';
    console.error('Checkout session error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
