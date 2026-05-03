import { NextResponse } from 'next/server';
import { groupTypeFromValue, type GroupSnapshot } from '@/lib/groups';
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
  const { error } = await admin.from('users').upsert({ id: user.id, email, name }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

async function toSnapshot(group: GroupRow, userId: string): Promise<GroupSnapshot> {
  const admin = getSupabaseAdmin();
  const { count } = await admin
    .from('group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', group.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

  const { data: member } = await admin
    .from('group_members')
    .select('role')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle();

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

    const body = (await request.json().catch(() => ({}))) as { inviteCode?: string };
    const inviteCode = body.inviteCode?.trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ error: '초대 코드가 필요합니다.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
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

    const expiresAt = group.invite_expires_at ? new Date(group.invite_expires_at).getTime() : 0;
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
      return NextResponse.json({ group: await toSnapshot(group, user.id) });
    }

    const { count } = await admin
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id);

    if ((count ?? 0) >= group.max_members) {
      return NextResponse.json({ error: '이미 정원이 찬 초대입니다.' }, { status: 409 });
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

    return NextResponse.json({ group: await toSnapshot(group, user.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown group join error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
