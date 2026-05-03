import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const PlaceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(40).default('기타'),
  address: z.string().trim().min(1).max(240),
  lat: z.number(),
  lng: z.number(),
  note: z.string().trim().max(2000).optional(),
  rating: z.number().min(1).max(5).optional(),
  amount: z.number().min(0).optional(),
  sourceUrl: z.string().url().nullable().optional(),
});

function toClientPlace(row: {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  review_count: number;
  source_url: string | null;
  community_reviews?: Array<{
    id: string;
    content: string | null;
    rating: number | null;
    review_type: 'couple' | 'friends';
    created_at: string;
    recommendation_count: number;
  }>;
}) {
  return {
    id: row.id,
    title: row.name,
    category: row.category ?? '기타',
    address: row.address ?? '',
    rating: row.rating ?? 0,
    reviewCount: row.review_count,
    lat: row.lat ?? 37.5665,
    lng: row.lng ?? 126.978,
    sourceType: 'community',
    sourceLabel: '커뮤니티',
    sourceUrl: row.source_url,
    reviews: (row.community_reviews ?? []).map((review) => ({
      id: review.id,
      author: '커플 유저',
      text: review.content ?? '',
      rating: review.rating ?? 0,
      reviewType: review.review_type,
      createdAt: review.created_at,
      recommendationCount: review.recommendation_count,
    })),
  };
}

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data: places, error } = await admin
    .from('public_places')
    .select('id, name, category, address, lat, lng, rating, review_count, source_url')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const placeIds = (places ?? []).map((place) => place.id);
  const { data: reviews, error: reviewsError } = placeIds.length
    ? await admin
        .from('community_reviews')
        .select('id, place_id, content, rating, review_type, created_at, recommendation_count')
        .in('place_id', placeIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
    : { data: [], error: null };

  if (reviewsError) return NextResponse.json({ error: reviewsError.message }, { status: 500 });

  const reviewsByPlace = new Map<string, NonNullable<typeof reviews>>();
  for (const review of reviews ?? []) {
    reviewsByPlace.set(review.place_id, [...(reviewsByPlace.get(review.place_id) ?? []), review]);
  }

  return NextResponse.json({
    places: (places ?? []).map((place) => toClientPlace({ ...place, community_reviews: reviewsByPlace.get(place.id) ?? [] })),
  });
}

export async function POST(request: Request) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PlaceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid community place' }, { status: 422 });

  const admin = getSupabaseAdmin();
  const { data: place, error: placeError } = await admin
    .from('public_places')
    .insert({
      name: parsed.data.title,
      category: parsed.data.category,
      address: parsed.data.address,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      rating: parsed.data.rating ?? 4,
      review_count: parsed.data.note ? 1 : 0,
      contributed_by: current.userId,
      source_url: parsed.data.sourceUrl ?? null,
      country_code: 'KR',
      locale: 'ko',
    })
    .select('*')
    .single();

  if (placeError) return NextResponse.json({ error: placeError.message }, { status: 500 });

  if (parsed.data.note) {
    await admin.from('community_reviews').insert({
      place_id: place.id,
      group_id: current.groupId,
      user_id: current.userId,
      review_type: 'couple',
      rating: parsed.data.rating ?? 4,
      content: parsed.data.note,
      amount: parsed.data.amount ?? null,
      is_public: true,
    });
  }

  return NextResponse.json({ place: toClientPlace({ ...place, community_reviews: [] }) }, { status: 201 });
}
