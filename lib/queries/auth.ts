import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/database.types';

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? 'buyer',
  };
}
