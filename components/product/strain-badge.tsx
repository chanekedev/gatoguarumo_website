import { cn } from '@/lib/utils';
import { intensityColor } from '@/lib/effects';

interface StrainBadgeProps {
  name: string;
  intensity: number;
  className?: string;
}

export function StrainBadge({ name, intensity, className }: StrainBadgeProps) {
  const clamped = Math.min(5, Math.max(1, Math.round(intensity)));
  const color = intensityColor(clamped);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink',
        className
      )}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: i < clamped ? color : '#E5E5E0' }}
          />
        ))}
      </span>
      {name}
    </span>
  );
}
