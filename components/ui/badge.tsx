import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'green' | 'yellow';
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-ink/5 text-ink',
  green: 'bg-brand-green/10 text-brand-green-dark',
  yellow: 'bg-brand-yellow/20 text-ink',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
