import { createClient } from '@/lib/supabase/server';

/** Narrow shape shared by the request-scoped and service-role clients. */
type SupabaseLike = { from: ReturnType<typeof createClient>['from'] };

/** What the browser is allowed to tell us: what, and how many. Never how much. */
export interface CartRequestItem {
  productId: string;
  variantId: string | null;
  quantity: number;
}

/** A line the server priced itself, safe to charge and to pay out on. */
export interface PricedLine {
  productId: string;
  variantId: string | null;
  vendorId: string;
  name: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
}

const MAX_LINES = 50;
const MAX_QUANTITY_PER_LINE = 99;

interface ProductPricingRow {
  id: string;
  name: string;
  base_price: number;
  status: string;
  vendor_id: string;
  variants: { id: string; name: string; price_override: number | null; stock_quantity: number }[];
}

/**
 * Rebuilds the cart from the database, ignoring any price, name or vendor the
 * client sent.
 *
 * The browser can freely edit a JSON body, so trusting a client-supplied price
 * would let anyone buy a $549 item for $10 — and, because the same figures
 * drive the Connect transfer, inflate what the platform pays a vendor. Prices,
 * vendor ownership and product names are therefore read fresh here and are the
 * only values that reach Stripe or the order records.
 *
 * Throws on anything that shouldn't be purchasable, so a bad line fails the
 * checkout instead of silently changing the total.
 */
export async function priceCart(
  items: CartRequestItem[],
  options: {
    /** Supabase client to read with. Defaults to the request-scoped one. */
    client?: SupabaseLike;
    /**
     * Whether to reject products that aren't on sale or in stock.
     *
     * True at checkout, to refuse selling something unavailable. False in the
     * webhook: the customer has already paid, so a product archived in the
     * seconds since must still be recorded as sold, not dropped on the floor.
     */
    enforceAvailability?: boolean;
  } = {}
): Promise<PricedLine[]> {
  const { client, enforceAvailability = true } = options;

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Your cart is empty.');
  }
  if (items.length > MAX_LINES) {
    throw new Error('That cart has too many separate items.');
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new Error('Invalid quantity.');
    }
    // Collapse duplicate lines so the same product can't be sent twice to
    // sneak past the per-line quantity cap.
    const key = `${item.productId}::${item.variantId ?? ''}`;
    quantities.set(key, (quantities.get(key) ?? 0) + quantity);
  }

  const productIds = Array.from(new Set(items.map((item) => String(item.productId))));
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, base_price, status, vendor_id, variants:product_variants(id, name, price_override, stock_quantity)')
    .in('id', productIds);

  if (error) throw new Error(`Could not price the cart: ${error.message}`);

  const rows = (data ?? []) as unknown as ProductPricingRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lines: PricedLine[] = [];
  for (const [key, quantity] of quantities) {
    const [productId, variantKey] = key.split('::');
    const variantId = variantKey ? variantKey : null;

    const product = byId.get(productId!);
    if (!product) throw new Error('One of those products is no longer available.');
    if (enforceAvailability && product.status !== 'active') {
      throw new Error(`"${product.name}" is not currently on sale.`);
    }

    let variantName: string | null = null;
    let unitPrice = product.base_price;

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (!variant) throw new Error(`That option for "${product.name}" is no longer available.`);
      if (enforceAvailability && variant.stock_quantity < quantity) {
        throw new Error(`"${product.name} — ${variant.name}" is out of stock.`);
      }
      variantName = variant.name;
      unitPrice = variant.price_override ?? product.base_price;
    }

    lines.push({
      productId: product.id,
      variantId,
      vendorId: product.vendor_id,
      name: product.name,
      variantName,
      unitPrice,
      quantity,
    });
  }

  return lines;
}
