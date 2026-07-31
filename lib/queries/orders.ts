import { createClient } from '@/lib/supabase/server';

export interface BuyerOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  placedAt: string | null;
  itemCount: number;
}

export async function getOrdersForBuyer(buyerId: string): Promise<BuyerOrderSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total, placed_at, items:order_items(id)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrdersForBuyer error', error.message);
    return [];
  }

  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    total: order.total,
    placedAt: order.placed_at,
    itemCount: order.items?.length ?? 0,
  }));
}

export interface VendorOrderSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  vendorPayoutAmount: number;
  createdAt: string;
  itemCount: number;
}

interface OrderVendorRow {
  id: string;
  status: string;
  subtotal: number;
  vendor_payout_amount: number;
  created_at: string;
  order: { order_number: string } | null;
  items: { id: string }[];
}

export async function getOrdersForVendor(vendorId: string): Promise<VendorOrderSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('order_vendors')
    .select('id, status, subtotal, vendor_payout_amount, created_at, order:orders(order_number), items:order_items(id)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .returns<OrderVendorRow[]>();

  if (error) {
    console.error('getOrdersForVendor error', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    orderId: row.id,
    orderNumber: row.order?.order_number ?? '—',
    status: row.status,
    subtotal: row.subtotal,
    vendorPayoutAmount: row.vendor_payout_amount,
    createdAt: row.created_at,
    itemCount: row.items?.length ?? 0,
  }));
}

export interface VendorStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
}

export async function getVendorStats(vendorId: string): Promise<VendorStats> {
  const supabase = createClient();
  const [{ data: orderVendors }, { count: productCount }] = await Promise.all([
    supabase.from('order_vendors').select('subtotal').eq('vendor_id', vendorId),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
  ]);

  const totalSales = (orderVendors ?? []).reduce((sum, row) => sum + row.subtotal, 0);

  return {
    totalSales,
    totalOrders: orderVendors?.length ?? 0,
    totalProducts: productCount ?? 0,
  };
}
