import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex items-center gap-2', className)}>
      <Image src="/brand/gato-guarumo-mark.svg" alt="Gato Guarumo" width={40} height={40} priority />
      <span className="font-display text-xl font-black tracking-tight">
        <span className="text-brand-green">Gato</span> <span className="text-brand-yellow-dark">Guarumo</span>
      </span>
    </Link>
  );
}
