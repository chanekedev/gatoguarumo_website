'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useCartStore } from '@/store/cart-store';
import { useFilterStore } from '@/store/filter-store';

const NAV_LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=blends', label: 'Blends' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/shop?category=apparel', label: 'Apparel' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const openCart = useCartStore((state) => state.open);
  const setQuery = useFilterStore((state) => state.setQuery);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('q');
    if (typeof query === 'string') {
      setQuery(query);
      router.push(`/shop?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink/70 transition-colors hover:text-brand-green"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 sm:flex"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            type="button"
            aria-label="Open cart"
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink/10"
          >
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <input
                name="q"
                type="search"
                autoFocus
                placeholder="Search catnip, blends, toys..."
                className="w-full rounded-full border border-ink/15 px-4 py-2 text-sm outline-none focus:border-brand-green"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3 sm:px-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5"
              >
                Account
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
