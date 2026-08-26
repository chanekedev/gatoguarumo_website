-- ============================================================================
-- Switch the storefront's default locale from US/USD to MX/MXN.
--
-- The initial schema assumed a US store. Gato Guarumo sells to Mexico, so the
-- column defaults are corrected here to match lib/config/locale.ts.
--
-- Defaults only apply to rows that omit the column, so existing data is left
-- untouched — there is none in production yet, and any test rows created
-- before this ran keep whatever they were written with.
-- ============================================================================

alter table addresses alter column country set default 'MX';
alter table orders alter column currency set default 'mxn';
