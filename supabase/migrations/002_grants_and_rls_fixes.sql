-- ============================================================================
-- Fixes for two issues found testing the Step 1 schema against a live project:
--
-- 1. Newly created tables in the `public` schema have no privileges for the
--    `anon`/`authenticated` roles until explicitly granted — RLS policies
--    only narrow access on top of that baseline, they don't replace it.
--    Without this, every query fails with "permission denied for table X"
--    regardless of how permissive the RLS policy is.
--
-- 2. The orders <-> order_vendors RLS policies referenced each other
--    (orders_buyer_read_own queries order_vendors, order_vendors_read
--    queries orders), which Postgres reports as "infinite recursion
--    detected in policy for relation orders". Fixed by moving the
--    cross-table check into a SECURITY DEFINER function — same technique
--    already used by is_admin()/owned_vendor_ids() — since a function
--    owned by a privileged role bypasses RLS on the table it queries
--    internally, breaking the cycle.
-- ============================================================================

-- ---- 1. Baseline grants ----
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- ---- 2. Break the orders <-> order_vendors RLS cycle ----
create or replace function order_visible_to_current_vendor(target_order_id uuid) returns boolean as $$
  select exists (
    select 1 from order_vendors
    where order_id = target_order_id
      and vendor_id in (select id from vendors where owner_id = auth.uid())
  );
$$ language sql security definer stable;

drop policy if exists "orders_buyer_read_own" on orders;
create policy "orders_buyer_read_own" on orders for select
  using (buyer_id = auth.uid() or is_admin() or order_visible_to_current_vendor(id));

create or replace function buyer_owns_order(target_order_id uuid) returns boolean as $$
  select exists (
    select 1 from orders where id = target_order_id and buyer_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "order_vendors_read" on order_vendors;
create policy "order_vendors_read" on order_vendors for select
  using (vendor_id in (select owned_vendor_ids()) or is_admin() or buyer_owns_order(order_id));

drop policy if exists "order_items_read" on order_items;
create policy "order_items_read" on order_items for select
  using (
    buyer_owns_order(order_id)
    or order_vendor_id in (select id from order_vendors where vendor_id in (select owned_vendor_ids()))
    or is_admin()
  );
