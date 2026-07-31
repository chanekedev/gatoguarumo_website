'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { StrainBadge } from '@/components/product/strain-badge';
import { useCartStore } from '@/store/cart-store';
import { cn, formatPrice } from '@/lib/utils';

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  avgRating: number;
  reviewCount: number;
  effects: { name: string; slug: string; intensity: number }[];
}

export function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  function handleQuickAdd() {
    addItem({
      productId: product.id,
      variantId: null,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      name: product.name,
      variantName: null,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    openCart();
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('group relative rounded-2xl border border-ink/10 bg-white', className)}
    >
      <button
        type="button"
        aria-label="Add to wishlist"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink/60 shadow-sm transition-colors hover:text-brand-green"
      >
        <Heart className="h-4 w-4" />
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-ink/5">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink/30">No image</div>
          )}
          {onSale && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-yellow px-2.5 py-0.5 text-xs font-bold text-ink">
              Sale
            </span>
          )}
        </div>

        <div className="space-y-2 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{product.vendorName}</p>
          <h3 className="line-clamp-2 font-semibold text-ink">{product.name}</h3>

          {product.effects.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.effects.slice(0, 2).map((effect) => (
                <StrainBadge key={effect.slug} name={effect.name} intensity={effect.intensity} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-ink/60">
            <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
            <span>{product.avgRating.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-ink/10 p-4 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-ink">{formatPrice(product.price)}</span>
          {onSale && product.compareAtPrice !== null && (
            <span className="text-sm text-ink/40 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label="Add to cart"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand-green"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
