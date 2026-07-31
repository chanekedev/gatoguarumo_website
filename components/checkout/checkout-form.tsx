'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { cartSubtotal, groupCartByVendor, useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';

export function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorGroups = groupCartByVendor(items);
  const subtotal = cartSubtotal(items);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            vendorId: item.vendorId,
            name: item.name,
            variantName: item.variantName,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong starting checkout.');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong starting checkout.');
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center">
        <ShoppingBag className="h-10 w-10 text-ink/20" />
        <p className="text-ink/60">Your cart is empty.</p>
        <Link href="/shop" className={buttonClasses('outline')}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-4 rounded-2xl border border-ink/10 p-5">
        {vendorGroups.map((group) => (
          <div key={group.vendorId}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              Sold by {group.vendorName}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? 'default'}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink/80">
                    {item.name}
                    {item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium text-ink">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-ink/10 pt-3 text-sm">
          <span className="text-ink/60">Subtotal</span>
          <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-ink/40">Final tax and shipping are calculated by Stripe at payment.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button type="button" onClick={handleCheckout} disabled={loading} className={buttonClasses('primary', 'lg', 'w-full')}>
        {loading ? 'Redirecting to Stripe...' : 'Continue to payment'}
      </button>
    </div>
  );
}
