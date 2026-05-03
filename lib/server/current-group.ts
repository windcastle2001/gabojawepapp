import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type CurrentCoupleGroup = {
  userId: string;
  groupId: string;
};

export async function getCurrentCoupleGroup(): Promise<CurrentCoupleGroup | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = getSupabaseAdmin();
  const { data: membership } = await admin
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership?.group_id) return null;

  const { data: group } = await admin
    .from('groups')
    .select('id, group_type, is_active')
    .eq('id', membership.group_id)
    .maybeSingle();

  if (!group || !group.is_active || group.group_type !== 'couple') return null;

  return { userId: user.id, groupId: group.id };
}
