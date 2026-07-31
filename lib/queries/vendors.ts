import { createClient } from '@/lib/supabase/server';

export interface VendorSummary {
  id: string;
  businessName: string;
  slug: string;
  logoUrl: string | null;
  isFlagship: boolean;
}

export async function getApprovedVendors(): Promise<VendorSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, slug, logo_url, is_flagship')
    .eq('status', 'approved')
    .order('is_flagship', { ascending: false })
    .order('business_name', { ascending: true });

  if (error) {
    console.error('getApprovedVendors error', error.message);
    return [];
  }
  return (data ?? []).map((v) => ({
    id: v.id,
    businessName: v.business_name,
    slug: v.slug,
    logoUrl: v.logo_url,
    isFlagship: v.is_flagship,
  }));
}

export async function getVendorForOwner(ownerId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('vendors').select('*').eq('owner_id', ownerId).maybeSingle();

  if (error) {
    console.error('getVendorForOwner error', error.message);
    return null;
  }
  return data;
}
