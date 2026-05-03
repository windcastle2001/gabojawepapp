import { NextResponse } from 'next/server';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('review_votes')
    .upsert({ review_id: id, user_id: current.userId, vote_type: 'recommend' }, { onConflict: 'review_id,user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
