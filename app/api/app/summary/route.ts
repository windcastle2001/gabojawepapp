import { NextResponse } from 'next/server';
import { getCurrentCoupleGroup } from '@/lib/server/current-group';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const current = await getCurrentCoupleGroup();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const [wishlistCount, completedCount, communityCount, recentWishlist] = await Promise.all([
    admin.from('group_wishlist').select('id', { count: 'exact', head: true }).eq('group_id', current.groupId).eq('is_completed', false),
    admin.from('group_wishlist').select('id', { count: 'exact', head: true }).eq('group_id', current.groupId).eq('is_completed', true),
    admin.from('community_reviews').select('id', { count: 'exact', head: true }).eq('group_id', current.groupId).eq('is_public', true),
    admin
      .from('group_wishlist')
      .select('id, title, item_type, category, address, tags, source_type, source_label, source_url, is_completed, created_at')
      .eq('group_id', current.groupId)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const error = wishlistCount.error ?? completedCount.error ?? communityCount.error ?? recentWishlist.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    counts: {
      wishlist: wishlistCount.count ?? 0,
      completed: completedCount.count ?? 0,
      community: communityCount.count ?? 0,
    },
    recentWishlist: (recentWishlist.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.item_type,
      category: item.category,
      address: item.address,
      tags: item.tags ?? [],
      addedBy: 'me',
      addedAt: item.created_at,
      completed: item.is_completed,
      completedAt: null,
      review: null,
      rating: null,
      sourceType: item.source_type,
      sourceLabel: item.source_label,
      sourceUrl: item.source_url,
    })),
  });
}
