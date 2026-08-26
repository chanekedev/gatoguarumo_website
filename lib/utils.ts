import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCY, LOCALE } from '@/lib/config/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = CURRENCY) {
  const formatted = new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(amount);
  // The peso and the dollar share the "$" symbol, and this storefront's copy
  // is in English — so spell the currency out to avoid shoppers reading
  // prices as USD and being surprised at checkout.
  return `${formatted} ${currency.toUpperCase()}`;
}
