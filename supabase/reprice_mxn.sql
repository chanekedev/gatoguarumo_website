-- ============================================================================
-- Reprice the sample catalog for MXN.
--
-- The seed data was written with USD in mind (12.99, 15.50, …). After the
-- switch to pesos those figures read as ~10 MXN, which is below Stripe's
-- minimum charge for the currency — checkout fails with "must add up to at
-- least $10.00 MXN".
--
-- Run once in the Supabase SQL Editor. Safe to re-run: it matches on slug and
-- only touches the sample products.
-- ============================================================================

update products set base_price = 249.00 where slug = 'mellow-meadow-catnip';
update products set base_price = 299.00 where slug = 'zoomies-silvervine-blend';
update products set base_price = 189.00 where slug = 'meltdown-valerian-rollies';
update products set base_price = 259.00 where slug = 'purrfect-relaxation-chamomile';

-- The larger jar variant carries its own price.
update product_variants
set price_override = 549.00
where name = '3oz Jar'
  and product_id = (select id from products where slug = 'mellow-meadow-catnip');
