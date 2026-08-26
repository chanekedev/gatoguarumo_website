-- ============================================================================
-- Gato Guarumo — Sample seed data
--
-- HOW TO USE:
-- 1. Sign up an account through the app first (http://localhost:3000/auth/register)
--    and confirm the email if your Supabase project requires it. This script
--    promotes THAT account to a vendor and makes it the Gato Guarumo flagship
--    store owner (vendors.owner_id has a foreign key into auth.users, so a
--    real signed-up user has to exist before this can run).
-- 2. Replace 'you@example.com' below with the email you signed up with.
-- 3. Run this whole file in the Supabase SQL Editor.
-- ============================================================================

insert into effects (name, slug, description, sort_order) values
  ('Chill', 'chill', 'Mellow, easygoing vibes.', 1),
  ('Purr-fect Relaxation', 'purrfect-relaxation', 'Deep chill, ready for a nap.', 2),
  ('Zoomies', 'zoomies', 'Sudden bursts of chaotic energy.', 3),
  ('Meltdown', 'meltdown', 'Full send. The rug becomes prey.', 4)
on conflict (slug) do nothing;

insert into categories (name, slug, sort_order) values
  ('Catnip', 'catnip', 1),
  ('Blends', 'blends', 2),
  ('Toys', 'toys', 3),
  ('Apparel', 'apparel', 4),
  ('Treats', 'treats', 5)
on conflict (slug) do nothing;

do $$
declare
  v_user_id uuid;
  v_vendor_id uuid;
  v_catnip_id uuid;
  v_blends_id uuid;
  v_chill_id uuid;
  v_zoomies_id uuid;
  v_meltdown_id uuid;
  v_relax_id uuid;
  v_product_id uuid;
begin
  select id into v_user_id from auth.users where email = 'you@example.com';
  if v_user_id is null then
    raise exception 'No user found with that email. Sign up at /auth/register first, then update the email in this script.';
  end if;

  update profiles set role = 'vendor' where id = v_user_id;

  insert into vendors (owner_id, business_name, slug, description, is_flagship, status, commission_rate)
  values (v_user_id, 'Gato Guarumo', 'gato-guarumo', 'The flagship Gato Guarumo store.', true, 'approved', 0.10)
  on conflict (slug) do update set owner_id = excluded.owner_id
  returning id into v_vendor_id;

  select id into v_catnip_id from categories where slug = 'catnip';
  select id into v_blends_id from categories where slug = 'blends';
  select id into v_chill_id from effects where slug = 'chill';
  select id into v_zoomies_id from effects where slug = 'zoomies';
  select id into v_meltdown_id from effects where slug = 'meltdown';
  select id into v_relax_id from effects where slug = 'purrfect-relaxation';

  insert into products (vendor_id, category_id, name, slug, description, base_price, status, is_featured, avg_rating, review_count, total_sold)
  values (v_vendor_id, v_catnip_id, 'Mellow Meadow Organic Catnip', 'mellow-meadow-catnip', 'Sun-dried, hand-sifted catnip buds. Slow burn, big chill.', 249.00, 'active', true, 4.8, 214, 900)
  returning id into v_product_id;
  insert into product_effects (product_id, effect_id, intensity) values (v_product_id, v_chill_id, 1);
  insert into product_variants (product_id, name, stock_quantity, is_default) values (v_product_id, '1oz Jar', 120, true);
  insert into product_variants (product_id, name, price_override, stock_quantity) values (v_product_id, '3oz Jar', 549.00, 60);

  insert into products (vendor_id, category_id, name, slug, description, base_price, status, is_featured, avg_rating, review_count, total_sold)
  values (v_vendor_id, v_blends_id, 'Zoomies Silvervine Blend', 'zoomies-silvervine-blend', 'Silvervine + catnip for cats who need the full send.', 299.00, 'active', true, 4.6, 88, 340)
  returning id into v_product_id;
  insert into product_effects (product_id, effect_id, intensity) values (v_product_id, v_zoomies_id, 5);
  insert into product_variants (product_id, name, stock_quantity, is_default) values (v_product_id, '1oz Pouch', 80, true);

  insert into products (vendor_id, category_id, name, slug, description, base_price, status, is_featured, avg_rating, review_count, total_sold)
  values (v_vendor_id, v_blends_id, 'Meltdown Valerian Rollies (3-Pack)', 'meltdown-valerian-rollies', 'Valerian root rollies. Not for the faint of heart.', 189.00, 'active', true, 4.9, 340, 1200)
  returning id into v_product_id;
  insert into product_effects (product_id, effect_id, intensity) values (v_product_id, v_meltdown_id, 4);
  insert into product_variants (product_id, name, stock_quantity, is_default) values (v_product_id, '3-Pack', 200, true);

  insert into products (vendor_id, category_id, name, slug, description, base_price, status, is_featured, avg_rating, review_count, total_sold)
  values (v_vendor_id, v_catnip_id, 'Purr-fect Relaxation Chamomile Blend', 'purrfect-relaxation-chamomile', 'Chamomile-infused catnip for the anxious rescue in your life.', 259.00, 'active', false, 4.7, 52, 140)
  returning id into v_product_id;
  insert into product_effects (product_id, effect_id, intensity) values (v_product_id, v_relax_id, 2);
  insert into product_variants (product_id, name, stock_quantity, is_default) values (v_product_id, '1oz Jar', 90, true);

end $$;
