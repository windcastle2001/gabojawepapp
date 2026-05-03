import { NextResponse } from 'next/server';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Database, Json } from '@/types/database';

type ProfileInsert = Database['public']['Tables']['partner_profiles']['Insert'];

function asJsonObject(value: unknown): Json {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Json;
  return {};
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

export async function PATCH(request: Request) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const profile: ProfileInsert = {
    group_id: current.groupId,
    user_id: current.userId,
    display_name: typeof body.displayName === 'string' ? body.displayName.trim() || null : null,
    birthday: typeof body.birthday === 'string' && body.birthday ? body.birthday : null,
    mbti: typeof body.mbti === 'string' && body.mbti ? body.mbti.toUpperCase() as ProfileInsert['mbti'] : null,
    zodiac: typeof body.zodiac === 'string' ? body.zodiac.trim() || null : null,
    personality_summary: typeof body.personalitySummary === 'string' ? body.personalitySummary.trim() || null : null,
    gift_preferences: asJsonObject(body.giftPreferences),
    food_preferences: asJsonObject(body.foodPreferences),
    date_preferences: asJsonObject(body.datePreferences),
    important_notes: asStringArray(body.importantNotes),
    ai_opt_in: body.aiOptIn === true,
  };

  const { data, error } = await getSupabaseAdmin()
    .from('partner_profiles')
    .upsert(profile, { onConflict: 'group_id,user_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
