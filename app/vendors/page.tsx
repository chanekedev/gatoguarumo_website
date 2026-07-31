import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { getApprovedVendors } from '@/lib/queries/vendors';

export const metadata: Metadata = { title: 'Vendors' };

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Guarumo Partners</h1>
      <p className="mt-1 text-ink/60">Independent artisans making pet gear as weird and good as ours.</p>

      {vendors.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
          No vendors yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="flex items-center gap-4 rounded-2xl border border-ink/10 p-4 transition-colors hover:border-brand-green"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink/5">
                {vendor.logoUrl ? (
                  <Image src={vendor.logoUrl} alt={vendor.businessName} width={56} height={56} className="object-cover" />
                ) : (
                  <Store className="h-6 w-6 text-ink/30" />
                )}
              </div>
              <div>
                <p className="font-semibold text-ink">{vendor.businessName}</p>
                {vendor.isFlagship && <p className="text-xs font-semibold text-brand-green">Flagship store</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
