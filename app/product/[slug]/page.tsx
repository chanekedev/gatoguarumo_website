import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { StrainBadge } from '@/components/product/strain-badge';
import { AddToCartPanel } from '@/components/product/add-to-cart-panel';
import { ProductCard } from '@/components/product/product-card';
import { getProductBySlug, getProducts } from '@/lib/queries/products';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };
  return { title: product.name, description: product.description ?? undefined };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const suggestions = (await getProducts({ sort: 'best_selling', limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink/5">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink/30">No image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-ink/5">
                  <Image src={url} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link href={`/vendors/${product.vendorSlug}`} className="text-sm font-semibold uppercase tracking-wide text-ink/50 hover:text-brand-green">
            {product.vendorName}
          </Link>
          <h1 className="font-display text-3xl font-bold text-ink">{product.name}</h1>

          <div className="flex items-center gap-1 text-sm text-ink/60">
            <Star className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
            <span className="font-semibold text-ink">{product.avgRating.toFixed(1)}</span>
            <span>({product.reviewCount} reviews)</span>
          </div>

          {product.effects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.effects.map((effect) => (
                <StrainBadge key={effect.slug} name={effect.name} intensity={effect.intensity} />
              ))}
            </div>
          )}

          {product.description && <p className="leading-relaxed text-ink/70">{product.description}</p>}

          <AddToCartPanel
            productId={product.id}
            name={product.name}
            basePrice={product.price}
            imageUrl={product.imageUrl}
            vendorId={product.vendorId}
            vendorName={product.vendorName}
            variants={product.variants}
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">You might also like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
