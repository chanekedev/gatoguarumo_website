/**
 * Storefront locale settings.
 *
 * Kept in one place so currency and shipping reach never drift apart across
 * the checkout session, the order records and the prices shown in the UI.
 */

/** ISO 4217 code, lowercase — Stripe expects it that way. */
export const CURRENCY = 'mxn';

/** BCP 47 locale used to format prices for display. */
export const LOCALE = 'es-MX';

/** ISO 3166-1 alpha-2 countries a customer may ship to. */
export const SHIPPING_COUNTRIES = ['MX'] as const;
