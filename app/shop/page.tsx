import type { Metadata } from 'next';
import { ProductCard } from '@/components/product/product-card';
import { ShopFilters } from '@/components/shop/shop-filters';
import { getProducts, type SortOption } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { getEffects } from '@/lib/queries/effects';

export const metadata: Metadata = { title: 'Shop' };

const VALID_SORTS: SortOption[] = ['newest', 'price_asc', 'price_desc', 'best_selling', 'top_rated'];

interface ShopSearchParams {
  category?: string;
  effect?: string;
  vendor?: string;
  sort?: string;
  q?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: ShopSearchParams }) {
  const sort = VALID_SORTS.includes(searchParams.sort as SortOption) ? (searchParams.sort as SortOption) : 'newest';

  const [products, categories, effects] = await Promise.all([
    getProducts({
      categorySlug: searchParams.category,
      vendorSlug: searchParams.vendor,
      effectSlugs: searchParams.effect?.split(',').filter(Boolean),
      sort,
      query: searchParams.q,
    }),
    getCategories(),
    getEffects(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Shop</h1>
      {searchParams.q && <p className="mt-1 text-ink/60">Results for "{searchParams.q}"</p>}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <ShopFilters categories={categories} effects={effects} />
        </aside>

        <div>
          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
              No products match those filters yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
