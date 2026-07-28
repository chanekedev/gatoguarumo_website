import Link from 'next/link';
import { Instagram, Mail, Twitter } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All products' },
      { href: '/shop?category=catnip', label: 'Organic catnip' },
      { href: '/shop?category=blends', label: 'Herbal blends' },
      { href: '/shop?category=toys', label: 'Toys & gear' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/vendors/apply', label: 'Become a Guarumo Partner' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms of service' },
      { href: '/legal/privacy', label: 'Privacy policy' },
      { href: '/legal/shipping-returns', label: 'Shipping & returns' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-ink/60">
              Premium organic catnip, silvervine blends, and edgy gear for cats who run the house.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 hover:text-brand-green"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 hover:text-brand-green"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@gatoguarumo.com"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 hover:text-brand-green"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-sm font-bold text-ink">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink/60 hover:text-brand-green">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-ink/10 pt-6 text-xs text-ink/40">
          © {new Date().getFullYear()} Gato Guarumo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
