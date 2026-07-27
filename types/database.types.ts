// Hand-written to match supabase/migrations/001_initial_schema.sql.
// Regenerate with `supabase gen types typescript --linked` once the project
// is linked to a live Supabase instance, and replace this file wholesale.

export type UserRole = 'buyer' | 'vendor' | 'admin';
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock';
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'partially_shipped'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type SuborderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed';
export type DiscountType = 'percentage' | 'fixed_amount';
export type AddressType = 'shipping' | 'billing';

interface Table<Row, Insert, Update = Partial<Insert>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_flagship: boolean;
  status: VendorStatus;
  commission_rate: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  payout_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Effect {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color_hex: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  sku: string | null;
  status: ProductStatus;
  is_featured: boolean;
  weight_grams: number | null;
  requires_shipping: boolean;
  avg_rating: number;
  review_count: number;
  total_sold: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductEffect {
  product_id: string;
  effect_id: string;
  intensity: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_override: number | null;
  stock_quantity: number;
  weight_grams: number | null;
  attributes: Record<string, string>;
  is_default: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  order_item_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  vendor_reply: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  profile_id: string;
  type: AddressType;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  buyer_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  currency: string;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  coupon_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  placed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderVendor {
  id: string;
  order_id: string;
  vendor_id: string;
  status: SuborderStatus;
  subtotal: number;
  shipping_amount: number;
  commission_rate: number;
  commission_amount: number;
  vendor_payout_amount: number;
  stripe_transfer_id: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  order_vendor_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  vendor_id: string | null;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  buyer_id: string;
  product_id: string;
  created_at: string;
}

export interface ShippingRate {
  id: string;
  vendor_id: string;
  name: string;
  flat_rate: number;
  free_shipping_threshold: number | null;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  is_active: boolean;
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  amount: number;
  status: PayoutStatus;
  stripe_payout_id: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Profile>;
      vendors: Table<Vendor, Partial<Vendor> & Pick<Vendor, 'owner_id' | 'business_name' | 'slug'>>;
      categories: Table<Category, Partial<Category> & Pick<Category, 'name' | 'slug'>>;
      effects: Table<Effect, Partial<Effect> & Pick<Effect, 'name' | 'slug'>>;
      products: Table<Product, Partial<Product> & Pick<Product, 'vendor_id' | 'name' | 'slug' | 'base_price'>>;
      product_effects: Table<ProductEffect, ProductEffect>;
      product_variants: Table<ProductVariant, Partial<ProductVariant> & Pick<ProductVariant, 'product_id' | 'name'>>;
      product_images: Table<ProductImage, Partial<ProductImage> & Pick<ProductImage, 'product_id' | 'url'>>;
      reviews: Table<Review, Partial<Review> & Pick<Review, 'product_id' | 'buyer_id' | 'rating'>>;
      addresses: Table<Address, Partial<Address> & Pick<Address, 'profile_id' | 'full_name' | 'line1' | 'city' | 'postal_code'>>;
      carts: Table<Cart, Partial<Cart>>;
      cart_items: Table<CartItem, Partial<CartItem> & Pick<CartItem, 'cart_id' | 'product_id'>>;
      orders: Table<Order, Partial<Order> & Pick<Order, 'order_number' | 'buyer_id'>>;
      order_vendors: Table<OrderVendor, Partial<OrderVendor> & Pick<OrderVendor, 'order_id' | 'vendor_id' | 'commission_rate'>>;
      order_items: Table<OrderItem, Partial<OrderItem> & Pick<OrderItem, 'order_id' | 'order_vendor_id' | 'product_name_snapshot' | 'unit_price' | 'quantity' | 'line_total'>>;
      coupons: Table<Coupon, Partial<Coupon> & Pick<Coupon, 'code' | 'discount_type' | 'discount_value'>>;
      wishlist_items: Table<WishlistItem, Partial<WishlistItem> & Pick<WishlistItem, 'buyer_id' | 'product_id'>>;
      shipping_rates: Table<ShippingRate, Partial<ShippingRate> & Pick<ShippingRate, 'vendor_id' | 'name'>>;
      vendor_payouts: Table<VendorPayout, Partial<VendorPayout> & Pick<VendorPayout, 'vendor_id' | 'amount'>>;
    };
  };
}
