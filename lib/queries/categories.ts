import { createClient } from '@/lib/supabase/server';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export async function getCategories(): Promise<CategorySummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getCategories error', error.message);
    return [];
  }
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.image_url }));
}
