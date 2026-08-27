import type { Metadata } from 'next';
import { ProductForm } from '@/components/vendor/product-form';
import { createProduct } from '@/app/vendor/products/actions';
import { getCategories } from '@/lib/queries/categories';
import { getEffects } from '@/lib/queries/effects';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const [categories, effects] = await Promise.all([getCategories(), getEffects()]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 font-display text-3xl font-bold text-ink">New product</h1>
      <p className="mb-8 text-ink/60">Save it as a draft first if you're not ready to sell.</p>

      <ProductForm
        action={createProduct}
        categories={categories}
        effects={effects}
        error={searchParams.error}
        submitLabel="Create product"
      />
    </main>
  );
}
