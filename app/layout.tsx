import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Navbar } from '@/components/nav/navbar';
import { Footer } from '@/components/footer/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { getCurrentUser } from '@/lib/queries/auth';
import './globals.css';

const displayFont = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: {
    default: 'Gato Guarumo',
    template: '%s | Gato Guarumo',
  },
  description: 'Premium organic catnip, silvervine blends, and edgy pet gear — no cap.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-body">
        <Navbar user={user} />
        {children}
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
