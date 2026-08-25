import { createClient } from '@/lib/supabase/server';
import type { ProductCardData } from '@/components/product/product-card';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'top_rated';

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  weight_grams: number | null;
  avg_rating: number;
  review_count: number;
  vendor: { id: string; business_name: string; slug: string } | null;
  images: { url: string; is_primary: boolean; sort_order: number }[];
  effects: { intensity: number; effect: { name: string; slug: string } | null }[];
}

const PRODUCT_SELECT = `
  id, slug, name, description, base_price, compare_at_price, weight_grams, avg_rating, review_count,
  vendor:vendors!inner(id, business_name, slug),
  images:product_images(url, is_primary, sort_order),
  effects:product_effects(intensity, effect:effects(name, slug))
`;

function primaryImageUrl(images: ProductRow['images']): string | null {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  return sorted[0]?.url ?? null;
}

export function toProductCardData(row: ProductRow): ProductCardData {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.base_price,
    compareAtPrice: row.compare_at_price,
    imageUrl: primaryImageUrl(row.images),
    vendorId: row.vendor?.id ?? '',
    vendorName: row.vendor?.business_name ?? 'Gato Guarumo',
    vendorSlug: row.vendor?.slug ?? '',
    avgRating: row.avg_rating,
    reviewCount: row.review_count,
    effects: row.effects
      .filter((e) => e.effect !== null)
      .map((e) => ({ name: e.effect!.name, slug: e.effect!.slug, intensity: e.intensity })),
  };
}

export interface ShopFilters {
  categorySlug?: string;
  vendorSlug?: string;
  effectSlugs?: string[];
  sort?: SortOption;
  query?: string;
  limit?: number;
}

const SORT_MAP: Record<SortOption, { column: string; ascending: boolean }> = {
  newest: { column: 'created_at', ascending: false },
  price_asc: { column: 'base_price', ascending: true },
  price_desc: { column: 'base_price', ascending: false },
  best_selling: { column: 'total_sold', ascending: false },
  top_rated: { column: 'avg_rating', ascending: false },
};

export async function getProducts(filters: ShopFilters = {}): Promise<ProductCardData[]> {
  const supabase = createClient();
  let query = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active');

  if (filters.categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.categorySlug)
      .maybeSingle();
    if (category) query = query.eq('category_id', category.id);
  }

  if (filters.vendorSlug) {
    const { data: vendor } = await supabase.from('vendors').select('id').eq('slug', filters.vendorSlug).maybeSingle();
    if (vendor) query = query.eq('vendor_id', vendor.id);
  }

  if (filters.effectSlugs && filters.effectSlugs.length > 0) {
    const { data: matches } = await supabase
      .from('product_effects')
      .select('product_id, effect:effects!inner(slug)')
      .in('effect.slug', filters.effectSlugs);
    const productIds = Array.from(new Set((matches ?? []).map((m) => m.product_id)));
    if (productIds.length === 0) return [];
    query = query.in('id', productIds);
  }

  if (filters.query) query = query.textSearch('search_vector', filters.query, { type: 'websearch' });

  const sort = SORT_MAP[filters.sort ?? 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending }).limit(filters.limit ?? 24);

  const { data, error } = await query.returns<ProductRow[]>();
  if (error) {
    console.error('getProducts error', error.message);
    return [];
  }
  return (data ?? []).map(toProductCardData);
}

export async function getFeaturedProducts(limit = 6): Promise<ProductCardData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<ProductRow[]>();

  if (error) {
    console.error('getFeaturedProducts error', error.message);
    return [];
  }
  return (data ?? []).map(toProductCardData);
}

export interface ProductVariantOption {
  id: string;
  name: string;
  priceOverride: number | null;
  stockQuantity: number;
  isDefault: boolean;
}

export interface ProductDetail extends ProductCardData {
  description: string | null;
  weightGrams: number | null;
  variants: ProductVariantOption[];
  images: string[];
}

interface ProductDetailRow extends ProductRow {
  variants: { id: string; name: string; price_override: number | null; stock_quantity: number; is_default: boolean }[];
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createClient();
  const { data: rawData, error } = await supabase
    .from('products')
    .select(`${PRODUCT_SELECT}, variants:product_variants(id, name, price_override, stock_quantity, is_default)`)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  const data = rawData as unknown as ProductDetailRow | null;

  if (error || !data) {
    if (error) console.error('getProductBySlug error', error.message);
    return null;
  }

  const base = toProductCardData(data);
  const sortedImages = [...data.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => img.url);
  return {
    ...base,
    description: data.description,
    weightGrams: data.weight_grams,
    images: sortedImages.length > 0 ? sortedImages : base.imageUrl ? [base.imageUrl] : [],
    variants: data.variants.map((v) => ({
      id: v.id,
      name: v.name,
      priceOverride: v.price_override,
      stockQuantity: v.stock_quantity,
      isDefault: v.is_default,
    })),
  };
}

export interface VendorProductRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  basePrice: number;
  totalSold: number;
  imageUrl: string | null;
}

export async function getProductsForVendorDashboard(vendorId: string): Promise<VendorProductRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, status, base_price, total_sold, images:product_images(url, is_primary, sort_order)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProductsForVendorDashboard error', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    basePrice: row.base_price,
    totalSold: row.total_sold,
    imageUrl: primaryImageUrl(row.images),
  }));
}
