import type {
  AddCommunityPlaceInput,
  AddWishInput,
  PrototypeCommunityPlace,
  PrototypeWish,
} from '@/lib/prototype-store';

export type RemoteWish = PrototypeWish & {
  id: string;
  amount?: number | null;
  currency?: string | null;
};

export type RemoteCommunityPlace = Omit<PrototypeCommunityPlace, 'id'> & {
  id: string;
};

export type RemotePartnerProfile = {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string | null;
  birthday: string | null;
  mbti: string | null;
  zodiac: string | null;
  personality_summary: string | null;
  gift_preferences: unknown;
  food_preferences: unknown;
  date_preferences: unknown;
  important_notes: string[];
  ai_opt_in: boolean;
  updated_at: string;
};

export type RemoteCoupleMemory = {
  id: string;
  subject_user_id: string | null;
  memory_type: string;
  title: string;
  content: string;
  visibility: 'couple' | 'self_only';
  is_ai_usable: boolean;
  updated_at: string;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export async function listRemoteWishlist() {
  const data = await jsonFetch<{ items: RemoteWish[] }>('/api/wishlist', { cache: 'no-store' });
  return data.items;
}

export async function addRemoteWish(input: AddWishInput) {
  const data = await jsonFetch<{ item: RemoteWish }>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      category: input.category,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      tags: input.tags,
      itemType: input.type,
      sourceType: input.sourceType,
      sourceLabel: input.sourceLabel,
      sourceUrl: input.sourceUrl,
    }),
  });
  return data.item;
}

export async function completeRemoteWish(id: string, rating: number, review: string, amount?: number | null) {
  const data = await jsonFetch<{ item: RemoteWish }>(`/api/wishlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: true, rating, review, amount: amount ?? null, currency: 'KRW' }),
  });
  return data.item;
}

export async function reopenRemoteWish(id: string) {
  const data = await jsonFetch<{ item: RemoteWish }>(`/api/wishlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: false }),
  });
  return data.item;
}

export async function shareRemoteWish(id: string) {
  await jsonFetch<{ reviewId: string; placeId: string }>(`/api/wishlist/${id}/share`, { method: 'POST' });
}

export async function listRemoteCommunityPlaces() {
  const data = await jsonFetch<{ places: RemoteCommunityPlace[] }>('/api/community/places', { cache: 'no-store' });
  return data.places;
}

export async function getRemoteAppSummary() {
  return jsonFetch<{
    counts: { wishlist: number; completed: number; community: number };
    recentWishlist: RemoteWish[];
  }>('/api/app/summary', { cache: 'no-store' });
}

export async function addRemoteCommunityPlace(input: AddCommunityPlaceInput) {
  const data = await jsonFetch<{ place: RemoteCommunityPlace }>('/api/community/places', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      category: input.category,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      note: input.note,
      rating: input.rating,
      sourceUrl: input.sourceUrl,
    }),
  });
  return data.place;
}

export async function getRemoteAiMemory() {
  return jsonFetch<{
    currentUserId: string;
    profiles: RemotePartnerProfile[];
    memories: RemoteCoupleMemory[];
  }>('/api/ai/memory', { cache: 'no-store' });
}

export async function addRemoteCoupleMemory(input: {
  title: string;
  content: string;
  memoryType?: string;
  subjectUserId?: string | null;
  visibility?: 'couple' | 'self_only';
  isAiUsable?: boolean;
}) {
  const data = await jsonFetch<{ memory: RemoteCoupleMemory }>('/api/ai/memory', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.memory;
}

export async function updateRemotePartnerProfile(input: {
  displayName?: string | null;
  birthday?: string | null;
  mbti?: string | null;
  zodiac?: string | null;
  personalitySummary?: string | null;
  giftPreferences?: unknown;
  foodPreferences?: unknown;
  datePreferences?: unknown;
  importantNotes?: string[];
  aiOptIn?: boolean;
}) {
  const data = await jsonFetch<{ profile: RemotePartnerProfile }>('/api/ai/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.profile;
}
