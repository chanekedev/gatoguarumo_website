import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

// Lazily constructed so importing this module never throws when
// STRIPE_SECRET_KEY isn't set yet (e.g. before Step 5's Stripe setup).
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20', typescript: true });
  }
  return cachedStripe;
}
