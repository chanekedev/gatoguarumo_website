'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/queries/auth';
import { getVendorForOwner } from '@/lib/queries/vendors';
import type { ProductStatus } from '@/types/database.types';

const VALID_STATUSES: ProductStatus[] = ['draft', 'active', 'archived', 'out_of_stock'];

/** Turns a product name into a URL-safe slug: "Zoomies Blend!" -> "zoomies-blend". */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents so "Cáñamo" -> "canamo"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves the vendor store for the signed-in user, refusing anyone who
 * doesn't own one. Every mutation below goes through this, so a buyer can't
 * reach these actions by POSTing directly.
 */
async function requireVendor() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/vendor/dashboard');
  if (user.role !== 'vendor' && user.role !== 'admin') redirect('/account');

  const vendor = await getVendorForOwner(user.id);
  if (!vendor) redirect('/vendor/dashboard');

  return vendor;
}

/** Reads the shared product fields out of the form. */
function readProductFields(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const basePrice = Number(formData.get('basePrice'));
  const compareAtRaw = String(formData.get('compareAtPrice') ?? '').trim();
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const status = String(formData.get('status') ?? 'draft') as ProductStatus;

  return {
    name,
    description: description || null,
    base_price: basePrice,
    compare_at_price: compareAtRaw ? Number(compareAtRaw) : null,
    category_id: categoryId || null,
    status: VALID_STATUSES.includes(status) ? status : 'draft',
    is_featured: formData.get('isFeatured') === 'on',
  };
}

function validate(fields: ReturnType<typeof readProductFields>): string | null {
  if (!fields.name) return 'Name is required.';
  if (!Number.isFinite(fields.base_price) || fields.base_price < 0) return 'Price must be a positive number.';
  if (fields.compare_at_price !== null && !Number.isFinite(fields.compare_at_price)) {
    return 'Compare-at price must be a number.';
  }
  return null;
}

/** Replaces a product's effects with the submitted set. */
async function replaceEffects(productId: string, formData: FormData) {
  const supabase = createClient();
  await supabase.from('product_effects').delete().eq('product_id', productId);

  const rows = formData
    .getAll('effectId')
    .map((raw) => String(raw))
    .filter(Boolean)
    .map((effectId) => ({
      product_id: productId,
      effect_id: effectId,
      intensity: Number(formData.get(`intensity_${effectId}`)) || 3,
    }));

  if (rows.length > 0) {
    await supabase.from('product_effects').insert(rows);
  }
}

export async function createProduct(formData: FormData) {
  const vendor = await requireVendor();
  const fields = readProductFields(formData);

  const problem = validate(fields);
  if (problem) redirect(`/vendor/products/new?error=${encodeURIComponent(problem)}`);

  const supabase = createClient();
  // Slugs are globally unique, so scope by vendor to avoid two stores
  // colliding on an obvious name like "catnip".
  const slug = `${slugify(fields.name)}-${vendor.slug}`;

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...fields, vendor_id: vendor.id, slug })
    .select('id')
    .single();

  if (error || !product) {
    const message = error?.message ?? 'Could not create the product.';
    redirect(`/vendor/products/new?error=${encodeURIComponent(message)}`);
  }

  await replaceEffects(product.id, formData);

  revalidatePath('/vendor/dashboard');
  revalidatePath('/shop');
  redirect('/vendor/dashboard');
}

export async function updateProduct(productId: string, formData: FormData) {
  const vendor = await requireVendor();
  const fields = readProductFields(formData);

  const problem = validate(fields);
  if (problem) redirect(`/vendor/products/${productId}/edit?error=${encodeURIComponent(problem)}`);

  const supabase = createClient();
  // Scoping the update by vendor_id means another vendor's id in the URL
  // matches no row rather than editing someone else's product.
  const { error } = await supabase.from('products').update(fields).eq('id', productId).eq('vendor_id', vendor.id);

  if (error) {
    redirect(`/vendor/products/${productId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  await replaceEffects(productId, formData);

  revalidatePath('/vendor/dashboard');
  revalidatePath('/shop');
  redirect('/vendor/dashboard');
}

/**
 * Archives rather than deletes: order_items reference products, and a past
 * order should keep pointing at what was actually sold.
 */
export async function archiveProduct(productId: string) {
  const vendor = await requireVendor();
  const supabase = createClient();

  await supabase.from('products').update({ status: 'archived' }).eq('id', productId).eq('vendor_id', vendor.id);

  revalidatePath('/vendor/dashboard');
  revalidatePath('/shop');
}
