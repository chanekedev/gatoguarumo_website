import { ProductCard, type ProductCardData } from '@/components/product/product-card';

// Temporary mock data for visual QA of the Step 3 component set. Replaced by
// real Supabase queries when the Shop page is built.
const MOCK_PRODUCTS: ProductCardData[] = [
  {
    id: '1',
    slug: 'mellow-meadow-catnip',
    name: 'Mellow Meadow Organic Catnip',
    price: 12.99,
    compareAtPrice: null,
    imageUrl: null,
    vendorId: 'v1',
    vendorName: 'Gato Guarumo',
    avgRating: 4.8,
    reviewCount: 214,
    effects: [{ name: 'Chill', slug: 'chill', intensity: 1 }],
  },
  {
    id: '2',
    slug: 'zoomies-silvervine-blend',
    name: 'Zoomies Silvervine Blend',
    price: 15.5,
    compareAtPrice: 18.0,
    imageUrl: null,
    vendorId: 'v2',
    vendorName: 'Paws & Chaos Co.',
    avgRating: 4.6,
    reviewCount: 88,
    effects: [{ name: 'Zoomies', slug: 'zoomies', intensity: 5 }],
  },
  {
    id: '3',
    slug: 'meltdown-valerian-rollie',
    name: 'Meltdown Valerian Rollie 3-Pack',
    price: 9.99,
    compareAtPrice: null,
    imageUrl: null,
    vendorId: 'v1',
    vendorName: 'Gato Guarumo',
    avgRating: 4.9,
    reviewCount: 340,
    effects: [{ name: 'Meltdown', slug: 'meltdown', intensity: 4 }],
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-black tracking-tight">
          <span className="text-brand-green">Gato</span> <span className="text-brand-yellow-dark">Guarumo</span>
        </h1>
        <p className="max-w-md text-ink/70">
          Premium organic catnip, silvervine blends, and edgy gear for cats who run the house.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <h2 className="mb-6 font-display text-2xl font-bold text-ink">Top Blends</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
