import { NextResponse } from 'next/server';
import { groupTypeFromValue, type GroupSnapshot } from '@/lib/groups';
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
  await admin.from('users').upsert({ id: user.id, email, name }, { onConflict: 'id' });
}

async function toSnapshot(group: Record<string, unknown>, userId: string): Promise<GroupSnapshot> {
  const admin = getSupabaseAdmin() as any;
  const groupId = String(group.id);
  const { count } = await admin.from('group_members').select('id', { count: 'exact', head: true }).eq('group_id', groupId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const inviteCode = String(group.invite_code);

  const { data: member } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

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

  const body = (await request.json().catch(() => ({}))) as { inviteCode?: string };
  const inviteCode = body.inviteCode?.trim().toUpperCase();
  if (!inviteCode) {
    return NextResponse.json({ error: '초대 코드가 필요합니다.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin() as any;
  await ensureProfile(user);

  const { data: group, error } = await admin
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !group) {
    return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 });
  }

  const expiresAt = typeof group.invite_expires_at === 'string' ? new Date(group.invite_expires_at).getTime() : 0;
  if (expiresAt && expiresAt < Date.now()) {
    return NextResponse.json({ error: '만료된 초대 코드입니다.' }, { status: 410 });
  }

  const { data: existingMember } = await admin
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json({ group: await toSnapshot(group as Record<string, unknown>, user.id) });
  }

  if (!existingMember) {
    const { count } = await admin
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id);

    if ((count ?? 0) >= Number(group.max_members ?? 2)) {
      return NextResponse.json({ error: '이미 정원이 찬 초대입니다.' }, { status: 409 });
    }
  }

  const { error: joinError } = await admin.from('group_members').upsert(
    {
      group_id: group.id,
      user_id: user.id,
      role: 'member',
    },
    { onConflict: 'group_id,user_id' },
  );

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  return NextResponse.json({ group: await toSnapshot(group as Record<string, unknown>, user.id) });
}
