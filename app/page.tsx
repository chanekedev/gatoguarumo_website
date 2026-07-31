import Link from 'next/link';
import { ProductCard } from '@/components/product/product-card';
import { getFeaturedProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { getEffects } from '@/lib/queries/effects';
import { buttonClasses } from '@/components/ui/button';
import { intensityColor } from '@/lib/effects';

export default async function HomePage() {
  const [featured, categories, effects] = await Promise.all([
    getFeaturedProducts(6),
    getCategories(),
    getEffects(),
  ]);

  return (
    <main>
      <section className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-black tracking-tight">
          <span className="text-brand-green">Gato</span> <span className="text-brand-yellow-dark">Guarumo</span>
        </h1>
        <p className="max-w-md text-ink/70">
          Premium organic catnip, silvervine blends, and edgy gear for cats who run the house.
        </p>
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>
          Shop the drop
        </Link>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 p-4 text-center transition-colors hover:border-brand-green"
              >
                <span className="font-semibold text-ink">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {effects.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 font-display text-2xl font-bold text-ink">Shop by Vibe</h2>
          <div className="flex flex-wrap gap-3">
            {effects.map((effect, i) => (
              <Link
                key={effect.id}
                href={`/shop?effect=${effect.slug}`}
                className="rounded-full border border-ink/10 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-green"
                style={{ borderColor: intensityColor(((i % 5) + 1)) }}
              >
                {effect.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Top Blends</h2>
          <Link href="/shop" className="text-sm font-semibold text-brand-green">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-ink/50">
            No featured products yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
