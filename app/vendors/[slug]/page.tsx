import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { ProductCard } from '@/components/product/product-card';
import { createClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/queries/products';

async function getVendorBySlug(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('vendors')
    .select('id, business_name, slug, description, logo_url, banner_url, is_flagship')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const vendor = await getVendorBySlug(params.slug);
  return { title: vendor?.business_name ?? 'Vendor not found' };
}

export default async function VendorDetailPage({ params }: { params: { slug: string } }) {
  const vendor = await getVendorBySlug(params.slug);
  if (!vendor) notFound();

  const products = await getProducts({ vendorSlug: vendor.slug, limit: 24 });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/5">
          {vendor.logo_url ? (
            <Image src={vendor.logo_url} alt={vendor.business_name} width={64} height={64} className="object-cover" />
          ) : (
            <Store className="h-7 w-7 text-ink/30" />
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{vendor.business_name}</h1>
          {vendor.is_flagship && <p className="text-sm font-semibold text-brand-green">Flagship store</p>}
        </div>
      </div>

      {vendor.description && <p className="mt-4 max-w-2xl text-ink/70">{vendor.description}</p>}

      <div className="mt-10">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
            No products from this vendor yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
