import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';

const WishSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(40).default('기타'),
  address: z.string().trim().max(240).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  tags: z.array(z.string().trim().max(30)).max(12).optional(),
  itemType: z.enum(['place', 'activity']).optional(),
  sourceType: z.string().trim().max(40).optional(),
  sourceLabel: z.string().trim().max(80).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
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

export async function GET() {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('group_wishlist')
    .select('*')
    .eq('group_id', current.groupId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: (data ?? []).map(toClientWish) });
}

export async function POST(request: Request) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = WishSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid wishlist item' }, { status: 422 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('group_wishlist')
    .insert({
      group_id: current.groupId,
      title: parsed.data.title,
      item_type: parsed.data.itemType ?? (parsed.data.address ? 'place' : 'activity'),
      category: parsed.data.category,
      address: parsed.data.address ?? null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      tags: parsed.data.tags ?? [],
      added_by: current.userId,
      source_type: parsed.data.sourceType ?? 'manual',
      source_label: parsed.data.sourceLabel ?? null,
      source_url: parsed.data.sourceUrl ?? null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: toClientWish(data) }, { status: 201 });
}
