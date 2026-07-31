import { createClient } from '@/lib/supabase/server';

export interface EffectSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export async function getEffects(): Promise<EffectSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('effects')
    .select('id, name, slug, description')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getEffects error', error.message);
    return [];
  }
  return data ?? [];
}
