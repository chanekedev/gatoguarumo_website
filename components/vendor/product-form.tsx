import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';
import type { CategorySummary } from '@/lib/queries/categories';
import type { EffectSummary } from '@/lib/queries/effects';

export interface ProductFormValues {
  name: string;
  description: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  categoryId: string | null;
  status: string;
  isFeatured: boolean;
  effects: { effectId: string; intensity: number }[];
}

interface ProductFormProps {
  action: (formData: FormData) => void;
  categories: CategorySummary[];
  effects: EffectSummary[];
  values?: ProductFormValues;
  error?: string;
  submitLabel: string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft — not visible in the shop' },
  { value: 'active', label: 'Active — on sale' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'archived', label: 'Archived — hidden' },
];

const inputClasses =
  'w-full rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none focus:border-brand-green';

export function ProductForm({ action, categories, effects, values, error, submitLabel }: ProductFormProps) {
  const selectedEffect = (effectId: string) => values?.effects.find((e) => e.effectId === effectId);

  return (
    <form action={action} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
          Product name
        </label>
        <input id="name" name="name" required defaultValue={values?.name} className={inputClasses} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values?.description ?? ''}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="basePrice" className="mb-1 block text-sm font-medium text-ink">
            Price (MXN)
          </label>
          <input
            id="basePrice"
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={values?.basePrice}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-ink/50">Stripe requires at least $10.00 MXN per order.</p>
        </div>

        <div>
          <label htmlFor="compareAtPrice" className="mb-1 block text-sm font-medium text-ink">
            Compare-at price <span className="font-normal text-ink/50">(optional)</span>
          </label>
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={values?.compareAtPrice ?? ''}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-ink/50">Shown struck through to mark a sale.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-ink">
            Category
          </label>
          <select id="categoryId" name="categoryId" defaultValue={values?.categoryId ?? ''} className={inputClasses}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink">
            Status
          </label>
          <select id="status" name="status" defaultValue={values?.status ?? 'draft'} className={inputClasses}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Potency / Effect</legend>
        <p className="mb-3 text-xs text-ink/50">
          Tick the vibes this product delivers, then set how strong each one hits (1 = mellow, 5 = full send).
        </p>
        <div className="space-y-3">
          {effects.map((effect) => {
            const selected = selectedEffect(effect.id);
            return (
              <div key={effect.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    name="effectId"
                    value={effect.id}
                    defaultChecked={Boolean(selected)}
                    className="h-4 w-4 accent-brand-green"
                  />
                  {effect.name}
                </label>
                <label className="ml-auto flex items-center gap-2 text-xs text-ink/60">
                  Intensity
                  <select
                    name={`intensity_${effect.id}`}
                    defaultValue={selected?.intensity ?? 3}
                    className="rounded-lg border border-ink/15 px-2 py-1 text-sm outline-none focus:border-brand-green"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="isFeatured"
          defaultChecked={values?.isFeatured}
          className="h-4 w-4 accent-brand-green"
        />
        Feature on the homepage
      </label>

      <div className="flex gap-3">
        <button type="submit" className={buttonClasses('primary', 'lg')}>
          {submitLabel}
        </button>
        <Link href="/vendor/dashboard" className={buttonClasses('outline', 'lg')}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
