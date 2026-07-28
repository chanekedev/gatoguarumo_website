'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { cartSubtotal, groupCartByVendor, useCartStore } from '@/store/cart-store';
import { formatPrice } from '@/lib/utils';

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const items = useCartStore((state) => state.items);
  const close = useCartStore((state) => state.close);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const vendorGroups = groupCartByVendor(items);
  const subtotal = cartSubtotal(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-ink/30"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 p-4">
              <h2 className="text-lg font-bold text-ink">Your Cart</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <ShoppingBag className="h-10 w-10 text-ink/20" />
                <p className="text-ink/60">Your cart is empty.</p>
                <button type="button" onClick={close} className={buttonClasses('outline')}>
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-6 overflow-y-auto p-4">
                  {vendorGroups.map((group) => (
                    <div key={group.vendorId}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
                        Sold by {group.vendorName}
                      </p>
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div key={`${item.productId}-${item.variantId ?? 'default'}`} className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                              {item.imageUrl && (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between">
                              <div>
                                <p className="line-clamp-1 text-sm font-semibold text-ink">{item.name}</p>
                                {item.variantName && <p className="text-xs text-ink/50">{item.variantName}</p>}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 rounded-full border border-ink/10 px-2 py-1">
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
                                <span className="text-sm font-semibold text-ink">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
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

                <div className="space-y-3 border-t border-ink/10 p-4">
                  <div className="flex items-center justify-between text-sm text-ink/60">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-ink/40">Taxes and shipping calculated at checkout.</p>
                  <Link href="/checkout" onClick={close} className={buttonClasses('primary', 'lg', 'w-full')}>
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
