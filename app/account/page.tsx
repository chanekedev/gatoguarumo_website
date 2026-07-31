import type { Metadata } from 'next';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { getCurrentUser } from '@/lib/queries/auth';
import { getOrdersForBuyer } from '@/lib/queries/orders';
import { signOut } from '@/app/auth/actions';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = { title: 'Your Account' };

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  partially_shipped: 'Partially shipped',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null; // middleware already redirects unauthenticated visitors

  const orders = await getOrdersForBuyer(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Your Account</h1>
          <p className="text-ink/60">{user.fullName ?? user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm font-semibold text-ink/60 hover:text-red-500">
            Sign out
          </button>
        </form>
      </div>

      {(user.role === 'vendor' || user.role === 'admin') && (
        <Link
          href="/vendor/dashboard"
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green"
        >
          Go to Vendor Dashboard
        </Link>
      )}

      <h2 className="mb-4 mt-10 text-lg font-bold text-ink">Order history</h2>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 p-12 text-center">
          <Package className="h-10 w-10 text-ink/20" />
          <p className="text-ink/60">No orders yet.</p>
          <Link href="/shop" className="font-semibold text-brand-green">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-ink">{order.orderNumber}</p>
                <p className="text-sm text-ink/50">
                  {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                  {order.placedAt ? ` · ${new Date(order.placedAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink">{formatPrice(order.total)}</p>
                <p className="text-sm text-ink/50">{STATUS_LABELS[order.status] ?? order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
