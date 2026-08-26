import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

/**
 * True when a connected account can actually receive its payouts.
 *
 * This marketplace uses separate charges and transfers: the platform charges
 * the customer, then transfers each vendor their share. Vendor accounts never
 * charge customers themselves, so `charges_enabled` stays false on them by
 * design — checking it would keep a fully-onboarded vendor stuck behind the
 * "connect Stripe" prompt forever. What matters is that they submitted their
 * details and the `transfers` capability is active.
 */
function canReceiveTransfers(account: Stripe.Account): boolean {
  return Boolean(account.details_submitted && account.capabilities?.transfers === 'active');
}

/**
 * Reconciles a vendor's stored onboarding flag against Stripe.
 *
 * `stripe_onboarding_complete` is normally set by the `account.updated`
 * webhook, but webhooks can be missed (endpoint down, misconfigured secret,
 * local tunnel not running), which would leave a fully-onboarded vendor
 * permanently showing the prompt. This asks Stripe directly and repairs the
 * row, so the dashboard never depends on a single delivery.
 *
 * Only called when there's something to repair — a saved account whose flag
 * is still false — so onboarded vendors cost no extra Stripe API calls.
 *
 * Returns the authoritative completion state. Never throws: if Stripe is
 * unreachable or unconfigured, it falls back to the stored value so the
 * dashboard still renders.
 */
export async function syncVendorOnboardingStatus(vendor: {
  id: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
}): Promise<boolean> {
  if (vendor.stripe_onboarding_complete || !vendor.stripe_account_id) {
    return vendor.stripe_onboarding_complete;
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
    const isComplete = canReceiveTransfers(account);

    if (isComplete) {
      const supabase = createClient();
      await supabase.from('vendors').update({ stripe_onboarding_complete: true }).eq('id', vendor.id);
    }

    return isComplete;
  } catch (err) {
    console.error('syncVendorOnboardingStatus error:', err instanceof Error ? err.message : err);
    return vendor.stripe_onboarding_complete;
  }
}

export { canReceiveTransfers };
