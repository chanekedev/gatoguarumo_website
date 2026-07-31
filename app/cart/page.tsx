'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { cartSubtotal, groupCartByVendor, useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const vendorGroups = groupCartByVendor(items);
  const subtotal = cartSubtotal(items);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <ShoppingBag className="h-12 w-12 text-ink/20" />
        <h1 className="font-display text-2xl font-bold text-ink">Your cart is empty</h1>
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>
          Start shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Your Cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {vendorGroups.map((group) => (
            <div key={group.vendorId}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
                Sold by {group.vendorName}
              </p>
              <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10">
                {group.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? 'default'}`} className="flex gap-4 p-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                      {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="font-semibold text-ink">{item.name}</p>
                        {item.variantName && <p className="text-sm text-ink/50">{item.variantName}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-full border border-ink/15 px-3 py-1.5">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5 text-ink/60" />
                          </button>
                          <span className="w-4 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5 text-ink/60" />
                          </button>
                        </div>
                        <span className="font-semibold text-ink">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="self-start text-ink/30 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-ink/10 p-5">
          <div className="flex items-center justify-between text-sm text-ink/60">
            <span>Subtotal</span>
            <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-ink/40">Taxes and shipping calculated at checkout.</p>
          <Link href="/checkout" className={buttonClasses('primary', 'lg', 'w-full')}>
            Checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}
