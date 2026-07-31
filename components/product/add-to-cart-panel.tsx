'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductVariantOption } from '@/lib/queries/products';

interface AddToCartPanelProps {
  productId: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  vendorId: string;
  vendorName: string;
  variants: ProductVariantOption[];
}

export function AddToCartPanel({ productId, name, basePrice, imageUrl, vendorId, vendorName, variants }: AddToCartPanelProps) {
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const price = selectedVariant?.priceOverride ?? basePrice;
  const outOfStock = selectedVariant !== null && selectedVariant.stockQuantity <= 0;

  function handleAdd() {
    addItem(
      {
        productId,
        variantId,
        vendorId,
        vendorName,
        name,
        variantName: selectedVariant?.name ?? null,
        price,
        imageUrl,
      },
      quantity
    );
    openCart();
  }

  return (
    <div className="space-y-5">
      <p className="text-2xl font-bold text-ink">{formatPrice(price)}</p>

      {variants.length > 1 && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink">Option</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setVariantId(variant.id)}
                disabled={variant.stockQuantity <= 0}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  variantId === variant.id
                    ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                    : 'border-ink/15 text-ink/70 hover:border-brand-green'
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-ink/15 px-3 py-2">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Minus className="h-4 w-4 text-ink/60" />
          </button>
          <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
          <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => q + 1)}>
            <Plus className="h-4 w-4 text-ink/60" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className={buttonClasses('primary', 'lg', 'flex-1 disabled:opacity-40')}
        >
          <ShoppingBag className="h-4 w-4" />
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}

