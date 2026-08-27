-- ============================================================================
-- Close privilege-escalation holes found in a pre-launch security review.
--
-- RLS decided *which rows* a user could touch but never *which columns*, and
-- the anon/publishable key is public by design — so anyone could call the
-- Supabase REST API directly from a browser console and:
--
--   1. Make themselves an admin:
--        update profiles set role = 'admin' where id = <their own id>
--      Allowed by profiles_update_own, since the row is theirs. Full takeover.
--
--   2. Approve their own store on their own terms:
--        insert into vendors (owner_id, ..., status, commission_rate)
--        values (<their id>, ..., 'approved', 0)
--      Allowed by vendors_owner_insert, which only checked ownership. That
--      bypasses vendor review and sets the platform's commission to zero.
--
--   3. Post fake "verified purchase" reviews:
--        insert into reviews (..., is_verified_purchase) values (..., true)
--      Allowed by reviews_buyer_insert, which only checked buyer_id.
--
-- Fix: keep the row-level rules, and add triggers that reject changes to the
-- privileged columns. Triggers are used because Postgres RLS cannot express
-- column-level conditions, and because they also cover the service-role and
-- SQL-editor paths rather than only the REST API.
--
-- Admins are still able to make these changes; the checks exempt them.
-- ============================================================================

-- ---- 0. Who is allowed to set privileged columns ----
-- Admins, the service role (the Stripe webhook), and direct SQL access such as
-- the Supabase SQL editor, which carries no JWT at all. Ordinary logged-in
-- users and anonymous visitors are not.
create or replace function is_privileged_writer() returns boolean as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
    ''
  ) in ('service_role', '')
  or is_admin();
$$ language sql security definer stable;

-- ---- 1. Role is not self-assignable ----
create or replace function guard_profile_role() returns trigger as $$
begin
  if new.role is distinct from old.role and not is_privileged_writer() then
    raise exception 'Only an admin can change a profile role';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_profile_role on profiles;
create trigger trg_guard_profile_role
  before update on profiles
  for each row execute function guard_profile_role();

-- ---- 2. Vendor approval and commission are set by the platform, not the vendor ----
create or replace function guard_vendor_privileged_columns() returns trigger as $$
declare
  default_commission numeric;
begin
  select coalesce(
    (select column_default::numeric from information_schema.columns
      where table_schema = 'public' and table_name = 'vendors' and column_name = 'commission_rate'),
    0.10
  ) into default_commission;

  if tg_op = 'INSERT' then
    if not is_privileged_writer() then
      -- A new store always starts pending, at the standard commission, and
      -- unlinked from Stripe, whatever the request asked for.
      new.status := 'pending';
      new.commission_rate := default_commission;
      new.is_flagship := false;
      new.stripe_account_id := null;
      new.stripe_onboarding_complete := false;
    end if;
    return new;
  end if;

  if not is_privileged_writer() then
    if new.status is distinct from old.status then
      raise exception 'Only an admin can change vendor status';
    end if;
    if new.commission_rate is distinct from old.commission_rate then
      raise exception 'Only an admin can change the commission rate';
    end if;
    if new.is_flagship is distinct from old.is_flagship then
      raise exception 'Only an admin can change flagship status';
    end if;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'Vendor ownership cannot be reassigned';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_vendor_columns on vendors;
create trigger trg_guard_vendor_columns
  before insert or update on vendors
  for each row execute function guard_vendor_privileged_columns();

-- ---- 3. "Verified purchase" is earned, not claimed ----
create or replace function guard_review_verified_flag() returns trigger as $$
begin
  if is_privileged_writer() then
    return new;
  end if;

  -- Only true when the review points at an order item the reviewer actually
  -- bought, for this product.
  new.is_verified_purchase := exists (
    select 1
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.id = new.order_item_id
      and oi.product_id = new.product_id
      and o.buyer_id = auth.uid()
  );

  -- A vendor reply is the seller's to write, not the reviewer's.
  if tg_op = 'INSERT' then
    new.vendor_reply := null;
  elsif new.vendor_reply is distinct from old.vendor_reply then
    raise exception 'Only the vendor can reply to a review';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_review_verified on reviews;
create trigger trg_guard_review_verified
  before insert or update on reviews
  for each row execute function guard_review_verified_flag();

-- ---- 4. Denormalised sales figures are not writable by sellers ----
-- avg_rating, review_count and total_sold are shown as social proof, so a
-- vendor editing their own product could otherwise inflate them at will.
create or replace function guard_product_stats() returns trigger as $$
begin
  if is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.avg_rating := 0;
    new.review_count := 0;
    new.total_sold := 0;
  else
    new.avg_rating := old.avg_rating;
    new.review_count := old.review_count;
    new.total_sold := old.total_sold;
    if new.vendor_id is distinct from old.vendor_id then
      raise exception 'Products cannot be moved between vendors';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_guard_product_stats on products;
create trigger trg_guard_product_stats
  before insert or update on products
  for each row execute function guard_product_stats();
