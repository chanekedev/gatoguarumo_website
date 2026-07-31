'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';

export default function CheckoutSuccessPage() {
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="h-12 w-12 text-brand-green" />
      <h1 className="font-display text-2xl font-bold text-ink">Order confirmed!</h1>
      <p className="text-ink/60">Thanks for shopping with Gato Guarumo. You'll get a receipt by email shortly.</p>
      <div className="flex gap-3">
        <Link href="/account" className={buttonClasses('outline')}>
          View orders
        </Link>
        <Link href="/shop" className={buttonClasses('primary')}>
          Keep shopping
        </Link>
      </div>
    </main>
  );
}
