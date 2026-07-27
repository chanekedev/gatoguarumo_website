-- ============================================================================
-- Gato Guarumo Marketplace — Initial Database Schema
-- Supabase (PostgreSQL) + Row-Level Security
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('buyer', 'vendor', 'admin');
create type vendor_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type product_status as enum ('draft', 'active', 'archived', 'out_of_stock');
create type order_status as enum ('pending_payment', 'paid', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled', 'refunded');
create type suborder_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type payout_status as enum ('pending', 'in_transit', 'paid', 'failed');
create type discount_type as enum ('percentage', 'fixed_amount');
create type address_type as enum ('shipping', 'billing');

-- ----------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'buyer',
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- VENDORS  (Gato Guarumo flagship store is a row here too, is_flagship = true,
-- so checkout/payout-split logic never needs a special case)
-- ----------------------------------------------------------------------------
create table vendors (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete restrict,
  business_name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  banner_url text,
  is_flagship boolean not null default false,
  status vendor_status not null default 'pending',
  commission_rate numeric(5,4) not null default 0.10, -- 10% platform fee, overridable per vendor
  stripe_account_id text unique,            -- Stripe Connect Express account
  stripe_onboarding_complete boolean not null default false,
  payout_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_vendors_owner on vendors(owner_id);
create index idx_vendors_status on vendors(status);

-- ----------------------------------------------------------------------------
-- CATEGORIES (self-referencing for subcategories)
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete set null,
  image_url text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_categories_parent on categories(parent_id);

-- ----------------------------------------------------------------------------
-- EFFECTS ("Potency/Effect" filter: Chill, Zoomies, Meltdown, Purr-fect Relaxation)
-- Modeled as a lookup table (not an enum) so vendors/admins can extend it.
-- ----------------------------------------------------------------------------
create table effects (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,        -- e.g. "Zoomies", "Meltdown", "Purr-fect Relaxation", "Chill"
  slug text not null unique,
  description text,
  color_hex text,                    -- for the strain-intensity badge UI
  icon text,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(10,2) not null check (base_price >= 0),
  compare_at_price numeric(10,2),
  sku text,
  status product_status not null default 'draft',
  is_featured boolean not null default false,
  weight_grams numeric(10,2),
  requires_shipping boolean not null default true,
  avg_rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  total_sold int not null default 0,
  meta_title text,
  meta_description text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_vendor on products(vendor_id);
create index idx_products_category on products(category_id);
create index idx_products_status on products(status);
create index idx_products_search on products using gin(search_vector);
create index idx_products_name_trgm on products using gin(name gin_trgm_ops);

-- Many-to-many: a product can carry multiple effects, each with an intensity 1-5
create table product_effects (
  product_id uuid not null references products(id) on delete cascade,
  effect_id uuid not null references effects(id) on delete cascade,
  intensity smallint not null default 3 check (intensity between 1 and 5),
  primary key (product_id, effect_id)
);

-- Variants (e.g. "1oz Jar", "Rollies 3-pack", "Refillable Plush - Medium")
create table product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text,
  price_override numeric(10,2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  weight_grams numeric(10,2),
  attributes jsonb not null default '{}'::jsonb, -- {"size":"1oz","color":"green"}
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_variants_product on product_variants(product_id);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false
);
create index idx_images_product on product_images(product_id);

-- ----------------------------------------------------------------------------
-- REVIEWS
-- ----------------------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  order_item_id uuid, -- FK added after order_items exists (verified-purchase link)
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified_purchase boolean not null default false,
  vendor_reply text,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id, order_item_id)
);
create index idx_reviews_product on reviews(product_id);

-- ----------------------------------------------------------------------------
-- ADDRESSES
-- ----------------------------------------------------------------------------
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type address_type not null default 'shipping',
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'US',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_addresses_profile on addresses(profile_id);

-- ----------------------------------------------------------------------------
-- CART (supports logged-in buyers and guests via session_id)
-- ----------------------------------------------------------------------------
create table carts (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references profiles(id) on delete cascade,
  session_id text, -- for guest carts, stored in an httpOnly cookie
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id is not null or session_id is not null)
);
create unique index idx_carts_buyer on carts(buyer_id) where buyer_id is not null;
create unique index idx_carts_session on carts(session_id) where session_id is not null;

create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);
create index idx_cart_items_cart on cart_items(cart_id);

-- ----------------------------------------------------------------------------
-- ORDERS  (one row per Stripe checkout; may fan out to several vendors)
-- ----------------------------------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique, -- human-readable, e.g. GG-100234
  buyer_id uuid not null references profiles(id) on delete restrict,
  status order_status not null default 'pending_payment',
  payment_status payment_status not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  tax_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'usd',
  shipping_address_id uuid references addresses(id),
  billing_address_id uuid references addresses(id),
  coupon_id uuid, -- FK added after coupons exists
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text,
  placed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_buyer on orders(buyer_id);
create index idx_orders_status on orders(status);

-- Per-vendor split of a marketplace order — drives Stripe Connect transfers
-- and independent fulfillment/tracking per seller.
create table order_vendors (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  vendor_id uuid not null references vendors(id) on delete restrict,
  status suborder_status not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  shipping_amount numeric(10,2) not null default 0,
  commission_rate numeric(5,4) not null,        -- snapshot of vendor.commission_rate at time of sale
  commission_amount numeric(10,2) not null default 0,
  vendor_payout_amount numeric(10,2) not null default 0,
  stripe_transfer_id text,
  tracking_carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, vendor_id)
);
create index idx_order_vendors_order on order_vendors(order_id);
create index idx_order_vendors_vendor on order_vendors(vendor_id);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  order_vendor_id uuid not null references order_vendors(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_order_vendor on order_items(order_vendor_id);

alter table reviews
  add constraint fk_reviews_order_item foreign key (order_item_id) references order_items(id) on delete set null;

-- ----------------------------------------------------------------------------
-- COUPONS  (platform-wide when vendor_id is null, vendor-scoped otherwise)
-- ----------------------------------------------------------------------------
create table coupons (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references vendors(id) on delete cascade,
  code text not null unique,
  discount_type discount_type not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table orders
  add constraint fk_orders_coupon foreign key (coupon_id) references coupons(id) on delete set null;

-- ----------------------------------------------------------------------------
-- WISHLIST
-- ----------------------------------------------------------------------------
create table wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, product_id)
);

-- ----------------------------------------------------------------------------
-- SHIPPING (simple flat-rate model per vendor; swap for a rates API later)
-- ----------------------------------------------------------------------------
create table shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  flat_rate numeric(10,2) not null default 0,
  free_shipping_threshold numeric(10,2),
  estimated_days_min int,
  estimated_days_max int,
  is_active boolean not null default true
);
create index idx_shipping_rates_vendor on shipping_rates(vendor_id);

-- ----------------------------------------------------------------------------
-- VENDOR PAYOUTS (ledger of Stripe Connect transfers/payouts)
-- ----------------------------------------------------------------------------
create table vendor_payouts (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  amount numeric(10,2) not null,
  status payout_status not null default 'pending',
  stripe_payout_id text,
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);
create index idx_vendor_payouts_vendor on vendor_payouts(vendor_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table vendors enable row level security;
alter table categories enable row level security;
alter table effects enable row level security;
alter table products enable row level security;
alter table product_effects enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table reviews enable row level security;
alter table addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_vendors enable row level security;
alter table order_items enable row level security;
alter table coupons enable row level security;
alter table wishlist_items enable row level security;
alter table shipping_rates enable row level security;
alter table vendor_payouts enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: vendor id(s) owned by the current user
create or replace function owned_vendor_ids() returns setof uuid as $$
  select id from vendors where owner_id = auth.uid();
$$ language sql security definer stable;

-- ---- profiles ----
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on profiles for insert
  with check (id = auth.uid());
create policy "profiles_admin_all" on profiles for all
  using (is_admin()) with check (is_admin());

-- ---- vendors ----
create policy "vendors_public_read_approved" on vendors for select
  using (status = 'approved' or owner_id = auth.uid() or is_admin());
create policy "vendors_owner_insert" on vendors for insert
  with check (owner_id = auth.uid());
create policy "vendors_owner_update" on vendors for update
  using (owner_id = auth.uid() or is_admin());
create policy "vendors_admin_delete" on vendors for delete
  using (is_admin());

-- ---- categories / effects (public read, admin write) ----
create policy "categories_public_read" on categories for select using (true);
create policy "categories_admin_write" on categories for insert with check (is_admin());
create policy "categories_admin_update" on categories for update using (is_admin());
create policy "categories_admin_delete" on categories for delete using (is_admin());

create policy "effects_public_read" on effects for select using (true);
create policy "effects_admin_write" on effects for insert with check (is_admin());
create policy "effects_admin_update" on effects for update using (is_admin());
create policy "effects_admin_delete" on effects for delete using (is_admin());

-- ---- products ----
create policy "products_public_read_active" on products for select
  using (status = 'active' or vendor_id in (select owned_vendor_ids()) or is_admin());
create policy "products_vendor_insert" on products for insert
  with check (vendor_id in (select owned_vendor_ids()));
create policy "products_vendor_update" on products for update
  using (vendor_id in (select owned_vendor_ids()) or is_admin());
create policy "products_vendor_delete" on products for delete
  using (vendor_id in (select owned_vendor_ids()) or is_admin());

-- ---- product_effects / product_variants / product_images (follow parent product) ----
create policy "product_effects_read" on product_effects for select using (true);
create policy "product_effects_vendor_write" on product_effects for all
  using (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin())
  with check (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin());

create policy "product_variants_read" on product_variants for select using (true);
create policy "product_variants_vendor_write" on product_variants for all
  using (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin())
  with check (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin());

create policy "product_images_read" on product_images for select using (true);
create policy "product_images_vendor_write" on product_images for all
  using (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin())
  with check (product_id in (select id from products where vendor_id in (select owned_vendor_ids())) or is_admin());

-- ---- reviews ----
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_buyer_insert" on reviews for insert
  with check (buyer_id = auth.uid());
create policy "reviews_buyer_update_own" on reviews for update
  using (buyer_id = auth.uid() or is_admin());
create policy "reviews_buyer_delete_own" on reviews for delete
  using (buyer_id = auth.uid() or is_admin());

-- ---- addresses ----
create policy "addresses_owner_all" on addresses for all
  using (profile_id = auth.uid() or is_admin())
  with check (profile_id = auth.uid());

-- ---- carts / cart_items (buyer_id match, or guest session — session check enforced in app layer via service role) ----
create policy "carts_owner_all" on carts for all
  using (buyer_id = auth.uid() or is_admin())
  with check (buyer_id = auth.uid() or buyer_id is null);
create policy "cart_items_owner_all" on cart_items for all
  using (cart_id in (select id from carts where buyer_id = auth.uid()) or is_admin())
  with check (cart_id in (select id from carts where buyer_id = auth.uid()));

-- ---- orders ----
create policy "orders_buyer_read_own" on orders for select
  using (buyer_id = auth.uid() or is_admin()
         or id in (select order_id from order_vendors where vendor_id in (select owned_vendor_ids())));
create policy "orders_buyer_insert_own" on orders for insert
  with check (buyer_id = auth.uid());
create policy "orders_admin_update" on orders for update
  using (is_admin());

-- ---- order_vendors (vendor sees & updates only their own suborder for fulfillment) ----
create policy "order_vendors_read" on order_vendors for select
  using (vendor_id in (select owned_vendor_ids()) or is_admin()
         or order_id in (select id from orders where buyer_id = auth.uid()));
create policy "order_vendors_vendor_update" on order_vendors for update
  using (vendor_id in (select owned_vendor_ids()) or is_admin());

-- ---- order_items (read-only via parent order/order_vendor visibility) ----
create policy "order_items_read" on order_items for select
  using (
    order_id in (select id from orders where buyer_id = auth.uid())
    or order_vendor_id in (select id from order_vendors where vendor_id in (select owned_vendor_ids()))
    or is_admin()
  );

-- ---- coupons ----
create policy "coupons_public_read_active" on coupons for select
  using (is_active or vendor_id in (select owned_vendor_ids()) or is_admin());
create policy "coupons_vendor_write" on coupons for insert
  with check (vendor_id in (select owned_vendor_ids()) or is_admin());
create policy "coupons_vendor_update" on coupons for update
  using (vendor_id in (select owned_vendor_ids()) or is_admin());

-- ---- wishlist_items ----
create policy "wishlist_owner_all" on wishlist_items for all
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

-- ---- shipping_rates ----
create policy "shipping_rates_public_read" on shipping_rates for select using (true);
create policy "shipping_rates_vendor_write" on shipping_rates for all
  using (vendor_id in (select owned_vendor_ids()) or is_admin())
  with check (vendor_id in (select owned_vendor_ids()) or is_admin());

-- ---- vendor_payouts ----
create policy "vendor_payouts_owner_read" on vendor_payouts for select
  using (vendor_id in (select owned_vendor_ids()) or is_admin());

-- ============================================================================
-- TRIGGERS: keep updated_at fresh
-- ============================================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_vendors_updated_at before update on vendors for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products for each row execute function set_updated_at();
create trigger trg_carts_updated_at before update on carts for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders for each row execute function set_updated_at();
create trigger trg_order_vendors_updated_at before update on order_vendors for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'buyer');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
