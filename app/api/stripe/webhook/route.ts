import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { canReceiveTransfers } from '@/lib/stripe/vendor-onboarding';
import { createAdminClient } from '@/lib/supabase/admin';
import { CURRENCY, SHIPPING_COUNTRIES } from '@/lib/config/locale';

interface CartEntry {
  p: string; // productId
  v: string | null; // variantId
  ven: string; // vendorId
  q: number; // quantity
  pr: number; // unit price
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Errors must surface as a non-2xx so Stripe retries the delivery. Swallowing
  // them would mean a customer is charged with no order ever recorded, and no
  // signal that anything went wrong.
  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === 'account.updated') {
      await handleAccountUpdated(event.data.object as Stripe.Account);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler failed';
    console.error(`Webhook ${event.type} failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createAdminClient();
  await supabase
    .from('vendors')
    .update({ stripe_onboarding_complete: canReceiveTransfers(account) })
    .eq('stripe_account_id', account.id);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const buyerId = session.metadata?.buyer_id;
  const cartJson = session.metadata?.cart;
  if (!buyerId || !cartJson) {
    throw new Error(
      `Session ${session.id} is missing metadata (buyer_id: ${Boolean(buyerId)}, cart: ${Boolean(cartJson)})`
    );
  }

  const cartEntries: CartEntry[] = JSON.parse(cartJson);
  const supabase = createAdminClient();

  // Skip if this session was already processed (webhook retries).
  const { data: existingOrder, error: lookupError } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();
  if (lookupError) throw new Error(`Order lookup failed: ${lookupError.message}`);
  if (existingOrder) return;

  let shippingAddressId: string | null = null;
  const shipping = session.shipping_details;
  if (shipping?.address) {
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert({
        profile_id: buyerId,
        type: 'shipping',
        full_name: shipping.name ?? 'Customer',
        line1: shipping.address.line1 ?? '',
        line2: shipping.address.line2,
        city: shipping.address.city ?? '',
        state: shipping.address.state,
        postal_code: shipping.address.postal_code ?? '',
        country: shipping.address.country ?? SHIPPING_COUNTRIES[0],
      })
      .select('id')
      .single();
    // A missing address shouldn't lose the order — record it and move on.
    if (addressError) console.error(`Shipping address insert failed: ${addressError.message}`);
    shippingAddressId = address?.id ?? null;
  }

  const orderNumber = `GG-${Date.now().toString(36).toUpperCase()}`;
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      buyer_id: buyerId,
      status: 'paid',
      payment_status: 'paid',
      subtotal: (session.amount_subtotal ?? 0) / 100,
      tax_total: (session.total_details?.amount_tax ?? 0) / 100,
      shipping_total: (session.total_details?.amount_shipping ?? 0) / 100,
      total: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? CURRENCY,
      shipping_address_id: shippingAddressId,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      stripe_checkout_session_id: session.id,
      placed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw new Error(`Order insert failed: ${orderError?.message ?? 'no row returned'}`);
  }

  const byVendor = new Map<string, CartEntry[]>();
  for (const entry of cartEntries) {
    const group = byVendor.get(entry.ven) ?? [];
    group.push(entry);
    byVendor.set(entry.ven, group);
  }

  for (const [vendorId, entries] of byVendor) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('commission_rate, stripe_account_id')
      .eq('id', vendorId)
      .maybeSingle();
    const commissionRate = vendor?.commission_rate ?? 0.1;
    const subtotal = entries.reduce((sum, e) => sum + e.pr * e.q, 0);
    const commissionAmount = subtotal * commissionRate;
    const payoutAmount = subtotal - commissionAmount;

    const { data: orderVendor, error: orderVendorError } = await supabase
      .from('order_vendors')
      .insert({
        order_id: order.id,
        vendor_id: vendorId,
        subtotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        vendor_payout_amount: payoutAmount,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderVendorError || !orderVendor) {
      throw new Error(
        `Vendor suborder insert failed for ${vendorId}: ${orderVendorError?.message ?? 'no row returned'}`
      );
    }

    for (const entry of entries) {
      const { data: product } = await supabase.from('products').select('name').eq('id', entry.p).maybeSingle();
      let variantName: string | null = null;
      if (entry.v) {
        const { data: variant } = await supabase.from('product_variants').select('name').eq('id', entry.v).maybeSingle();
        variantName = variant?.name ?? null;
      }

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        order_vendor_id: orderVendor.id,
        product_id: entry.p,
        variant_id: entry.v,
        product_name_snapshot: product?.name ?? 'Product',
        variant_name_snapshot: variantName,
        unit_price: entry.pr,
        quantity: entry.q,
        line_total: entry.pr * entry.q,
      });

      if (itemError) {
        throw new Error(`Order item insert failed for product ${entry.p}: ${itemError.message}`);
      }
    }

    // Move the vendor's share to their connected Stripe account. If they
    // haven't finished Connect onboarding yet, this fails gracefully and
    // the order stays recorded with order_vendors.status = 'pending' for
    // manual payout once they're onboarded.
    if (vendor?.stripe_account_id) {
      try {
        const stripe = getStripe();
        const transfer = await stripe.transfers.create({
          amount: Math.round(payoutAmount * 100),
          currency: session.currency ?? CURRENCY,
          destination: vendor.stripe_account_id,
          transfer_group: order.id,
        });
        await supabase
          .from('order_vendors')
          .update({ stripe_transfer_id: transfer.id, status: 'confirmed' })
          .eq('id', orderVendor.id);
      } catch (err) {
        console.error(`Transfer failed for vendor ${vendorId}`, err instanceof Error ? err.message : err);
      }
    }
  }
}
