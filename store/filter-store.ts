import { create } from 'zustand';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'top_rated';

interface FilterState {
  categorySlug: string | null;
  vendorId: string | null;
  effectSlugs: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: SortOption;
  query: string;
  setCategory: (slug: string | null) => void;
  setVendor: (vendorId: string | null) => void;
  toggleEffect: (slug: string) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSort: (sort: SortOption) => void;
  setQuery: (query: string) => void;
  reset: () => void;
}

const initialState = {
  categorySlug: null,
  vendorId: null,
  effectSlugs: [] as string[],
  priceMin: null,
  priceMax: null,
  sort: 'newest' as SortOption,
  query: '',
};

export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,
  setCategory: (slug) => set({ categorySlug: slug }),
  setVendor: (vendorId) => set({ vendorId }),
  toggleEffect: (slug) =>
    set((state) => ({
      effectSlugs: state.effectSlugs.includes(slug)
        ? state.effectSlugs.filter((s) => s !== slug)
        : [...state.effectSlugs, slug],
    })),
  setPriceRange: (min, max) => set({ priceMin: min, priceMax: max }),
  setSort: (sort) => set({ sort }),
  setQuery: (query) => set({ query }),
  reset: () => set(initialState),
}));
