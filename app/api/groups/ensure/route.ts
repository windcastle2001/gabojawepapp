import { NextResponse } from 'next/server';
import { createInviteCode, groupTypeFromValue, type AppGroupType, type GroupSnapshot } from '@/lib/groups';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

async function ensureProfile(user: AuthUser) {
  const admin = getSupabaseAdmin();
  const email = user.email ?? `${user.id}@anonymous.local`;
  const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;

  await admin.from('users').upsert(
    {
      id: user.id,
      email,
      name,
    },
    { onConflict: 'id' },
  );
}

async function toSnapshot(group: Record<string, unknown>, userId: string): Promise<GroupSnapshot> {
  const admin = getSupabaseAdmin() as any;
  const groupId = String(group.id);
  const { count } = await admin.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', groupId);

  const { data: member } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const inviteCode = String(group.invite_code);

  return {
    id: groupId,
    name: String(group.name),
    groupType: groupTypeFromValue(group.group_type),
    inviteCode,
    inviteUrl: appUrl ? `${appUrl}/join/${inviteCode}` : `/join/${inviteCode}`,
    memberCount: count ?? 1,
    maxMembers: Number(group.max_members ?? 2),
    isOwner: member?.role === 'owner',
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { groupType?: AppGroupType };
  const groupType = groupTypeFromValue(body.groupType);
  const admin = getSupabaseAdmin() as any;

  await ensureProfile(user);

  const { data: existingMember } = await admin
    .from('group_members')
    .select('role, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingGroup = existingMember?.groups as Record<string, unknown> | null | undefined;
  if (existingGroup?.id) {
    return NextResponse.json({ group: await toSnapshot(existingGroup, user.id) });
  }

  let group: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 5 && !group; attempt += 1) {
    const inviteCode = createInviteCode(groupType);
    const { data, error } = await admin
      .from('groups')
      .insert({
        name: groupType === 'friends' ? '친구 모임' : '커플 공간',
        group_type: groupType,
        max_members: groupType === 'friends' ? 10 : 2,
        invite_code: inviteCode,
        invite_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        created_by: user.id,
      })
      .select('*')
      .single();

    if (!error && data) group = data as Record<string, unknown>;
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
}
