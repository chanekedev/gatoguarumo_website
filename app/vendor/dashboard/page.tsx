import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { DollarSign, Package, ShoppingBag } from 'lucide-react';
import { getCurrentUser } from '@/lib/queries/auth';
import { getVendorForOwner } from '@/lib/queries/vendors';
import { getVendorStats, getOrdersForVendor } from '@/lib/queries/orders';
import { getProductsForVendorDashboard } from '@/lib/queries/products';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Vendor Dashboard' };

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
  out_of_stock: 'Out of stock',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // middleware already redirects unauthenticated visitors

  if (user.role !== 'vendor' && user.role !== 'admin') {
    redirect('/account');
  }

  const vendor = await getVendorForOwner(user.id);

  if (!vendor) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">No vendor store linked yet</h1>
        <p className="mt-2 text-ink/60">
          Your account has vendor access, but isn't linked to a store. Contact the Gato Guarumo team to finish setup.
        </p>
      </main>
    );
  }

  const [stats, products, orders] = await Promise.all([
    getVendorStats(vendor.id),
    getProductsForVendorDashboard(vendor.id),
    getOrdersForVendor(vendor.id),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{vendor.business_name} Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total sales" value={formatPrice(stats.totalSales)} />
        <StatCard icon={ShoppingBag} label="Orders" value={String(stats.totalOrders)} />
        <StatCard icon={Package} label="Products" value={String(stats.totalProducts)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-ink">Products</h2>
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-ink/50">
            No products yet.
          </p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                  {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{product.name}</p>
                  <p className="text-sm text-ink/50">{formatPrice(product.basePrice)} · {product.totalSold} sold</p>
                </div>
                <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/70">
                  {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-ink">Orders</h2>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-ink/50">
            No orders yet.
          </p>
        ) : (
          <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                  <p className="text-sm text-ink/50">
                    {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatPrice(order.vendorPayoutAmount)} payout</p>
                  <p className="text-sm text-ink/50">{ORDER_STATUS_LABELS[order.status] ?? order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof DollarSign; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/10 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-ink/50">{label}</p>
        <p className="text-xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
