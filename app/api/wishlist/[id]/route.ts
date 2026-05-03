import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

const UpdateSchema = z.object({
  completed: z.boolean().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  review: z.string().trim().max(2000).nullable().optional(),
  amount: z.number().min(0).nullable().optional(),
  currency: z.string().trim().min(3).max(3).optional(),
});

type WishRow = Database['public']['Tables']['group_wishlist']['Row'];

function toClientWish(row: WishRow) {
  return {
    id: row.id,
    title: row.title,
    type: row.item_type,
    category: row.category,
    address: row.address,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    tags: row.tags ?? [],
    addedAt: row.created_at,
    completed: row.is_completed,
    completedAt: row.completed_at,
    review: row.review_content,
    rating: row.rating,
    amount: row.amount,
    currency: row.currency,
    sharedToMap: Boolean(row.shared_review_id),
    sourceType: row.source_type,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid wishlist update' }, { status: 422 });

  const patch: Database['public']['Tables']['group_wishlist']['Update'] = {};
  if (parsed.data.completed !== undefined) {
    patch.is_completed = parsed.data.completed;
    patch.completed_at = parsed.data.completed ? new Date().toISOString() : null;
    patch.completed_by = parsed.data.completed ? current.userId : null;
    if (!parsed.data.completed) {
      patch.rating = null;
      patch.review_content = null;
      patch.amount = null;
      patch.shared_review_id = null;
    }
  }
  if (parsed.data.rating !== undefined) patch.rating = parsed.data.rating;
  if (parsed.data.review !== undefined) patch.review_content = parsed.data.review;
  if (parsed.data.amount !== undefined) patch.amount = parsed.data.amount;
  if (parsed.data.currency !== undefined) patch.currency = parsed.data.currency;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('group_wishlist')
    .update(patch)
    .eq('id', id)
    .eq('group_id', current.groupId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: toClientWish(data) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('group_wishlist').delete().eq('id', id).eq('group_id', current.groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
