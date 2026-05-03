import { NextResponse } from 'next/server';
import { createInviteCode, groupTypeFromValue, type AppGroupType, type GroupSnapshot } from '@/lib/groups';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type GroupRow = Database['public']['Tables']['groups']['Row'];

async function ensureProfile(user: AuthUser) {
  const admin = getSupabaseAdmin();
  const email = user.email ?? `${user.id}@anonymous.local`;
  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;

  const { error } = await admin.from('users').upsert(
    {
      id: user.id,
      email,
      name,
    },
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message);
}

async function toSnapshot(group: GroupRow, userId: string): Promise<GroupSnapshot> {
  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', group.id);

  const { data: member } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

  return {
    id: group.id,
    name: group.name,
    groupType: groupTypeFromValue(group.group_type),
    inviteCode: group.invite_code,
    inviteUrl: appUrl ? `${appUrl}/join/${group.invite_code}` : `/join/${group.invite_code}`,
    memberCount: count ?? 1,
    maxMembers: group.max_members,
    isOwner: member?.role === 'owner',
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    await request.json().catch(() => ({}));
    const groupType: AppGroupType = 'couple';
    const admin = getSupabaseAdmin();

    await ensureProfile(user);

    const { data: existingMember } = await admin
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingMember?.group_id) {
      const { data: existingGroup } = await admin
        .from('groups')
        .select('*')
        .eq('id', existingMember.group_id)
        .maybeSingle();

      if (existingGroup) {
        return NextResponse.json({ group: await toSnapshot(existingGroup, user.id) });
      }
    }

    let group: GroupRow | null = null;
    for (let attempt = 0; attempt < 5 && !group; attempt += 1) {
      const inviteCode = createInviteCode(groupType);
      const { data, error } = await admin
        .from('groups')
        .insert({
          name: '커플 공간',
          group_type: groupType,
          max_members: 2,
          invite_code: inviteCode,
          invite_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
          created_by: user.id,
        })
        .select('*')
        .single();

      if (!error && data) group = data;
    }

    if (!group) {
      return NextResponse.json({ error: '초대 공간을 만들지 못했습니다.' }, { status: 500 });
    }

    const { error: memberError } = await admin.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ group: await toSnapshot(group, user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown group ensure error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
