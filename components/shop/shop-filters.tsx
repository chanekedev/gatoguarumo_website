'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/lib/queries/categories';
import type { EffectSummary } from '@/lib/queries/effects';

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_selling', label: 'Best selling' },
  { value: 'top_rated', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function ShopFilters({ categories, effects }: { categories: CategorySummary[]; effects: EffectSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category');
  const activeEffects = searchParams.get('effect')?.split(',').filter(Boolean) ?? [];
  const activeSort = searchParams.get('sort') ?? 'newest';

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleCategory(slug: string) {
    updateParams((params) => {
      if (activeCategory === slug) params.delete('category');
      else params.set('category', slug);
    });
  }

  function toggleEffect(slug: string) {
    updateParams((params) => {
      const next = activeEffects.includes(slug)
        ? activeEffects.filter((s) => s !== slug)
        : [...activeEffects, slug];
      if (next.length > 0) params.set('effect', next.join(','));
      else params.delete('effect');
    });
  }

  function setSort(value: string) {
    updateParams((params) => params.set('sort', value));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.slug)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                activeCategory === category.slug
                  ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                  : 'border-ink/15 text-ink/70 hover:border-brand-green'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Potency / Effect</h3>
        <div className="flex flex-wrap gap-2">
          {effects.map((effect) => (
            <button
              key={effect.id}
              type="button"
              onClick={() => toggleEffect(effect.slug)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                activeEffects.includes(effect.slug)
                  ? 'border-brand-yellow-dark bg-brand-yellow/20 text-ink'
                  : 'border-ink/15 text-ink/70 hover:border-brand-yellow-dark'
              )}
            >
              {effect.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-ink">Sort by</h3>
        <select
          value={activeSort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
