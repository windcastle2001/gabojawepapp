import { NextResponse } from 'next/server';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { data: wish, error: wishError } = await admin
    .from('group_wishlist')
    .select('*')
    .eq('id', id)
    .eq('group_id', current.groupId)
    .maybeSingle();

  if (wishError) return NextResponse.json({ error: wishError.message }, { status: 500 });
  if (!wish) return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
  if (!wish.address || !wish.lat || !wish.lng || !wish.rating || !wish.review_content) {
    return NextResponse.json({ error: 'Address, coordinates, rating, and review are required' }, { status: 422 });
  }

  const { data: place, error: placeError } = await admin
    .from('public_places')
    .insert({
      name: wish.title,
      category: wish.category,
      address: wish.address,
      lat: wish.lat,
      lng: wish.lng,
      rating: wish.rating,
      review_count: 1,
      contributed_by: current.userId,
      country_code: 'KR',
      locale: 'ko',
      place_provider: wish.source_type === 'kakao_search' ? 'kakao' : null,
      source_url: wish.source_url,
    })
    .select('*')
    .single();

  if (placeError) return NextResponse.json({ error: placeError.message }, { status: 500 });

  const { data: review, error: reviewError } = await admin
    .from('community_reviews')
    .insert({
      place_id: place.id,
      group_id: current.groupId,
      user_id: current.userId,
      review_type: 'couple',
      rating: wish.rating,
      content: wish.review_content,
      amount: wish.amount,
      currency: wish.currency,
      is_public: true,
    })
    .select('*')
    .single();

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  await admin.from('group_wishlist').update({ shared_review_id: review.id }).eq('id', wish.id);

  return NextResponse.json({ reviewId: review.id, placeId: place.id });
}
