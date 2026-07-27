import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Gato Guarumo',
    template: '%s | Gato Guarumo',
  },
  description: 'Premium organic catnip, silvervine blends, and edgy pet gear — no cap.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
