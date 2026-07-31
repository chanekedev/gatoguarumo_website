import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/queries/auth';
import { CheckoutForm } from '@/components/checkout/checkout-form';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/checkout');

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Checkout</h1>
      <p className="mt-1 text-ink/60">Shipping address and payment are collected securely by Stripe.</p>
      <CheckoutForm />
    </main>
  );
}
