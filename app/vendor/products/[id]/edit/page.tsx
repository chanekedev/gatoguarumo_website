import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ProductForm } from '@/components/vendor/product-form';
import { updateProduct } from '@/app/vendor/products/actions';
import { getCategories } from '@/lib/queries/categories';
import { getEffects } from '@/lib/queries/effects';
import { getCurrentUser } from '@/lib/queries/auth';
import { getVendorForOwner } from '@/lib/queries/vendors';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Edit product' };

interface EditableProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  category_id: string | null;
  status: string;
  is_featured: boolean;
  effects: { effect_id: string; intensity: number }[];
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null; // middleware already redirects unauthenticated visitors
  if (user.role !== 'vendor' && user.role !== 'admin') redirect('/account');

  const vendor = await getVendorForOwner(user.id);
  if (!vendor) redirect('/vendor/dashboard');

  const supabase = createClient();
  // Scoped by vendor_id so another store's product id 404s instead of opening.
  const { data } = await supabase
    .from('products')
    .select('id, name, description, base_price, compare_at_price, category_id, status, is_featured, effects:product_effects(effect_id, intensity)')
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .maybeSingle();

  const product = data as unknown as EditableProduct | null;
  if (!product) notFound();

  const [categories, effects] = await Promise.all([getCategories(), getEffects()]);

  const updateThisProduct = updateProduct.bind(null, product.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 font-display text-3xl font-bold text-ink">Edit product</h1>
      <p className="mb-8 text-ink/60">{product.name}</p>

      <ProductForm
        action={updateThisProduct}
        categories={categories}
        effects={effects}
        error={searchParams.error}
        submitLabel="Save changes"
        values={{
          name: product.name,
          description: product.description,
          basePrice: product.base_price,
          compareAtPrice: product.compare_at_price,
          categoryId: product.category_id,
          status: product.status,
          isFeatured: product.is_featured,
          effects: product.effects.map((e) => ({ effectId: e.effect_id, intensity: e.intensity })),
        }}
      />
    </main>
  );
}
