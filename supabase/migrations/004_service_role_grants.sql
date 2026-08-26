-- ============================================================================
-- Grant table access to `service_role`.
--
-- Migration 002 granted baseline privileges to `anon` and `authenticated` but
-- left out `service_role`, which is the role the Stripe webhook connects as
-- (lib/supabase/admin.ts). A paid checkout therefore failed with
-- "permission denied for table orders" and no order was recorded.
--
-- Worth being precise about why: service_role bypasses RLS *policies*, but
-- table GRANTs are a separate and earlier check. Postgres refuses the
-- statement before any policy is evaluated, so bypassing RLS never helped.
--
-- Supabase projects normally ship these grants, but these tables were created
-- from raw SQL in migration 001, so they never inherited them.
-- ============================================================================

grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to service_role;

-- Cover tables and sequences added by future migrations too.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
