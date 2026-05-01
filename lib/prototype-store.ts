'use client';

export type GroupType = 'couple' | 'friends';
export type AuthMode = 'guest' | 'google';
export type ReviewType = 'couple' | 'friends';
export type WishSourceType = 'manual' | 'community' | 'kakao_search' | 'shared_link';

export interface PrototypeSession {
  authMode: AuthMode;
  groupType: GroupType | null;
  onboardingComplete: boolean;
  partnerAccepted: boolean;
  friendMembers: number;
  inviteCode: string;
  connectedAt: string | null;
}

export interface PrototypeWish {
  id: number;
  title: string;
  type: 'place' | 'activity';
  category: string;
  address: string | null;
  addedBy: 'me' | 'partner' | 'member';
  addedAt: string;
  completed: boolean;
  completedAt: string | null;
  review: string | null;
  rating: number | null;
  tags: string[];
  lat?: number;
  lng?: number;
  sharedToMap?: boolean;
  reviewType?: ReviewType;
  sourceType?: WishSourceType;
  sourceLabel?: string;
  sourceUrl?: string | null;
}

export interface PrototypeReview {
  id: number;
  author: string;
  text: string;
  rating: number;
  reviewType: ReviewType;
  createdAt: string;
}

export interface PrototypeCommunityPlace {
  id: number;
  title: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  reviews: PrototypeReview[];
  sourceType?: WishSourceType;
  sourceLabel?: string;
  sourceUrl?: string | null;
}

export interface AddWishInput {
  title: string;
  category: string;
  address: string | null;
  lat?: number;
  lng?: number;
  tags?: string[];
  type?: 'place' | 'activity';
  addedBy?: PrototypeWish['addedBy'];
  sourceType?: WishSourceType;
  sourceLabel?: string;
  sourceUrl?: string | null;
}

export interface AddCommunityPlaceInput {
  title: string;
  category: string;
  address: string;
  lat?: number;
  lng?: number;
  note?: string;
  rating?: number;
  reviewType?: ReviewType;
  sourceType?: WishSourceType;
  sourceLabel?: string;
  sourceUrl?: string | null;
}

const SESSION_KEY = 'dm_session_v2';
const WISHLIST_KEY = 'dm_wishlist_v2';
const COMMUNITY_KEY = 'dm_community_places_v2';

function today() {
  return new Date().toISOString().split('T')[0];
}

function createInviteCode(groupType: GroupType) {
  return groupType === 'couple' ? 'DM-4821' : 'FR-7392';
}

function createDefaultReview(author: string, text: string, rating: number, reviewType: ReviewType, createdAt: string): PrototypeReview {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    author,
    text,
    rating,
    reviewType,
    createdAt,
  };
}

export function createPrototypeSession(authMode: AuthMode, groupType: GroupType): PrototypeSession {
  return {
    authMode,
    groupType,
    onboardingComplete: true,
    partnerAccepted: false,
    friendMembers: 1,
    inviteCode: createInviteCode(groupType),
    connectedAt: null,
  };
}

export const DEFAULT_SESSION: PrototypeSession = {
  authMode: 'guest',
  groupType: null,
  onboardingComplete: false,
  partnerAccepted: false,
  friendMembers: 1,
  inviteCode: createInviteCode('couple'),
  connectedAt: null,
};

export const DEFAULT_WISHLIST: PrototypeWish[] = [
  {
    id: 1,
    title: '루프탑 성수',
    type: 'place',
    category: '카페',
    address: '서울 성동구 성수이로 78',
    addedBy: 'partner',
    addedAt: '2026-04-10',
    completed: false,
    completedAt: null,
    review: null,
    rating: null,
    tags: ['분위기', '야경'],
    lat: 37.5445,
    lng: 127.0557,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '직접 저장',
    sourceUrl: null,
  },
  {
    id: 2,
    title: '모모당 연남',
    type: 'place',
    category: '카페',
    address: '서울 마포구 동교로 247',
    addedBy: 'me',
    addedAt: '2026-04-08',
    completed: false,
    completedAt: null,
    review: null,
    rating: null,
    tags: ['브런치', '조용한'],
    lat: 37.5564,
    lng: 126.9237,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '직접 저장',
    sourceUrl: null,
  },
  {
    id: 3,
    title: '청담 테이블',
    type: 'place',
    category: '맛집',
    address: '서울 강남구 압구정로 412',
    addedBy: 'partner',
    addedAt: '2026-04-05',
    completed: false,
    completedAt: null,
    review: null,
    rating: null,
    tags: ['기념일', '디너'],
    lat: 37.5219,
    lng: 127.0439,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '파트너 저장',
    sourceUrl: null,
  },
  {
    id: 4,
    title: '서울숲 산책',
    type: 'activity',
    category: '산책',
    address: '서울 성동구 뚝섬로 273',
    addedBy: 'me',
    addedAt: '2026-03-20',
    completed: false,
    completedAt: null,
    review: null,
    rating: null,
    tags: ['야외', '주말'],
    lat: 37.5446,
    lng: 127.0374,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '직접 저장',
    sourceUrl: null,
  },
  {
    id: 5,
    title: '전시 보러 가기',
    type: 'activity',
    category: '액티비티',
    address: null,
    addedBy: 'me',
    addedAt: '2026-04-15',
    completed: false,
    completedAt: null,
    review: null,
    rating: null,
    tags: ['실내', '주말'],
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '직접 저장',
    sourceUrl: null,
  },
  {
    id: 6,
    title: '야구장 관람',
    type: 'activity',
    category: '액티비티',
    address: '서울 송파구 올림픽로 25',
    addedBy: 'partner',
    addedAt: '2026-04-01',
    completed: true,
    completedAt: '2026-04-12',
    review: '응원 분위기가 좋아서 다시 가고 싶었어요.',
    rating: 5,
    tags: ['스포츠', '맥주'],
    lat: 37.5122,
    lng: 127.0719,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '파트너 저장',
    sourceUrl: null,
  },
  {
    id: 7,
    title: '한강 피크닉',
    type: 'activity',
    category: '산책',
    address: '서울 영등포구 여의동로 330',
    addedBy: 'me',
    addedAt: '2026-03-28',
    completed: true,
    completedAt: '2026-04-06',
    review: '노을 자리 잡고 있기 좋았어요.',
    rating: 4,
    tags: ['피크닉', '야외'],
    lat: 37.5284,
    lng: 126.9336,
    sharedToMap: false,
    sourceType: 'manual',
    sourceLabel: '직접 저장',
    sourceUrl: null,
  },
];

export const DEFAULT_COMMUNITY_PLACES: PrototypeCommunityPlace[] = [
  {
    id: 101,
    title: '루프탑 성수',
    category: '카페',
    address: '서울 성동구 성수이로 78',
    rating: 4.7,
    reviewCount: 3,
    lat: 37.5445,
    lng: 127.0557,
    sourceType: 'community',
    sourceLabel: '커뮤니티',
    sourceUrl: null,
    reviews: [
      createDefaultReview('커플 유저', '사진 찍고 대화하기 좋았어요.', 5, 'couple', '2026-04-21'),
      createDefaultReview('친구 모임 4명', '수다 떨기 편하고 좌석도 넉넉했어요.', 4, 'friends', '2026-04-22'),
      createDefaultReview('커플 유저', '성수 데이트 코스로 붙이기 좋았어요.', 5, 'couple', '2026-04-23'),
    ],
  },
  {
    id: 102,
    title: '한강 피크닉 스팟',
    category: '산책',
    address: '서울 영등포구 여의동로 330',
    rating: 4.5,
    reviewCount: 2,
    lat: 37.5284,
    lng: 126.9336,
    sourceType: 'community',
    sourceLabel: '커뮤니티',
    sourceUrl: null,
    reviews: [
      createDefaultReview('친구 모임 3명', '돗자리 깔고 오래 있기 좋았어요.', 5, 'friends', '2026-04-18'),
      createDefaultReview('커플 유저', '해질 때 가면 분위기가 진짜 좋아요.', 4, 'couple', '2026-04-19'),
    ],
  },
  {
    id: 103,
    title: '청담 테이블',
    category: '맛집',
    address: '서울 강남구 압구정로 412',
    rating: 4.8,
    reviewCount: 2,
    lat: 37.5219,
    lng: 127.0439,
    sourceType: 'community',
    sourceLabel: '커뮤니티',
    sourceUrl: null,
    reviews: [
      createDefaultReview('커플 유저', '기념일 저녁으로 가기 좋은 분위기였어요.', 5, 'couple', '2026-04-15'),
      createDefaultReview('친구 모임 4명', '여럿이 가도 메뉴 고르기 괜찮았어요.', 4, 'friends', '2026-04-16'),
    ],
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('dm-store-change'));
}

function normalizeSession(session: Partial<PrototypeSession>): PrototypeSession {
  const groupType = session.groupType === 'friends' ? 'friends' : session.groupType === 'couple' ? 'couple' : null;
  const partnerAccepted = Boolean(session.partnerAccepted && groupType === 'couple');

  return {
    authMode: session.authMode === 'google' ? 'google' : 'guest',
    groupType,
    onboardingComplete: Boolean(session.onboardingComplete && groupType),
    partnerAccepted,
    friendMembers: groupType === 'friends' ? Math.min(Math.max(session.friendMembers ?? 1, 1), 10) : 1,
    inviteCode:
      typeof session.inviteCode === 'string' && session.inviteCode.length > 0
        ? session.inviteCode
        : groupType
          ? createInviteCode(groupType)
          : createInviteCode('couple'),
    connectedAt: partnerAccepted ? session.connectedAt ?? today() : null,
  };
}

function resolveReviewAuthor(session: PrototypeSession) {
  return session.groupType === 'friends' ? `친구 모임 ${Math.max(session.friendMembers, 1)}명` : '커플 유저';
}

function upsertCommunityPlace(
  places: PrototypeCommunityPlace[],
  input: AddCommunityPlaceInput,
  session?: PrototypeSession
) {
  const reviewType = input.reviewType ?? (session?.groupType === 'friends' ? 'friends' : 'couple');
  const author = session ? resolveReviewAuthor(session) : '가자고 제보';
  const note = input.note?.trim();
  const rating = input.rating ?? 4;
  const placeIndex = places.findIndex(
    (place) => place.title.trim() === input.title.trim() || place.address.trim() === input.address.trim()
  );

  const review = note
    ? createDefaultReview(author, note, rating, reviewType, today())
    : null;

  if (placeIndex >= 0) {
    const current = places[placeIndex];
    const nextReviews = review ? [review, ...current.reviews] : current.reviews;
    const nextRating = nextReviews.length
      ? Number((nextReviews.reduce((sum, item) => sum + item.rating, 0) / nextReviews.length).toFixed(1))
      : current.rating;

    places[placeIndex] = {
      ...current,
      category: input.category || current.category,
      lat: input.lat ?? current.lat,
      lng: input.lng ?? current.lng,
      sourceType: input.sourceType ?? current.sourceType,
      sourceLabel: input.sourceLabel ?? current.sourceLabel,
      sourceUrl: input.sourceUrl ?? current.sourceUrl,
      rating: nextRating,
      reviewCount: nextReviews.length,
      reviews: nextReviews,
    };
    return places[placeIndex];
  }

  const created: PrototypeCommunityPlace = {
    id: Date.now(),
    title: input.title.trim(),
    category: input.category,
    address: input.address.trim(),
    rating,
    reviewCount: review ? 1 : 0,
    lat: input.lat ?? 37.5665,
    lng: input.lng ?? 126.978,
    reviews: review ? [review] : [],
    sourceType: input.sourceType ?? 'manual',
    sourceLabel: input.sourceLabel ?? '제보 등록',
    sourceUrl: input.sourceUrl ?? null,
  };

  places.unshift(created);
  return created;
}

export function getSession() {
  const hasStoredSession = typeof window !== 'undefined' && window.localStorage.getItem(SESSION_KEY) !== null;
  const current = normalizeSession(readJson<Partial<PrototypeSession>>(SESSION_KEY, DEFAULT_SESSION));
  const legacyMode = typeof window !== 'undefined' ? window.localStorage.getItem('dm_mode') : null;
  const legacyGroup = typeof window !== 'undefined' ? window.localStorage.getItem('dm_group_type') : null;

  if (!hasStoredSession && !current.onboardingComplete && (legacyMode || legacyGroup)) {
    return createPrototypeSession(
      legacyMode === 'google' ? 'google' : 'guest',
      legacyGroup === 'friends' ? 'friends' : 'couple'
    );
  }

  return current;
}

export function saveSession(session: PrototypeSession) {
  const next = normalizeSession(session);
  writeJson(SESSION_KEY, next);
  if (typeof window !== 'undefined') {
    if (next.onboardingComplete && next.groupType) {
      window.localStorage.setItem('dm_mode', next.authMode === 'google' ? 'google' : 'demo');
      window.localStorage.setItem('dm_group_type', next.groupType);
    } else {
      window.localStorage.removeItem('dm_mode');
      window.localStorage.removeItem('dm_group_type');
    }
  }
}

export function getWishlist() {
  return readJson<PrototypeWish[]>(WISHLIST_KEY, DEFAULT_WISHLIST);
}

export function saveWishlist(items: PrototypeWish[]) {
  writeJson(WISHLIST_KEY, items);
}

export function getCommunityPlaces() {
  return readJson<PrototypeCommunityPlace[]>(COMMUNITY_KEY, DEFAULT_COMMUNITY_PLACES);
}

export function saveCommunityPlaces(places: PrototypeCommunityPlace[]) {
  writeJson(COMMUNITY_KEY, places);
}

export function addWishFromPlace(place: AddWishInput) {
  const items = getWishlist();
  if (items.some((item) => item.title === place.title && item.address === place.address && !item.completed)) {
    return false;
  }

  saveWishlist([
    {
      id: Date.now(),
      title: place.title,
      type: place.type ?? 'place',
      category: place.category,
      address: place.address,
      addedBy: place.addedBy ?? 'me',
      addedAt: today(),
      completed: false,
      completedAt: null,
      review: null,
      rating: null,
      tags: place.tags ?? [],
      lat: place.lat,
      lng: place.lng,
      sharedToMap: false,
      sourceType: place.sourceType ?? 'manual',
      sourceLabel: place.sourceLabel ?? '직접 저장',
      sourceUrl: place.sourceUrl ?? null,
    },
    ...items,
  ]);

  return true;
}

export function completeWish(id: number, rating: number, review: string) {
  const nextItems = getWishlist().map((item) =>
    item.id === id
      ? {
          ...item,
          completed: true,
          completedAt: today(),
          rating,
          review: review.trim(),
        }
      : item
  );

  saveWishlist(nextItems);
  return nextItems.find((item) => item.id === id) ?? null;
}

export function reopenWish(id: number) {
  const nextItems = getWishlist().map((item) =>
    item.id === id
      ? {
          ...item,
          completed: false,
          completedAt: null,
          rating: null,
          review: null,
          sharedToMap: false,
          reviewType: undefined,
        }
      : item
  );
  saveWishlist(nextItems);
}

export function shareWishReviewToCommunity(item: PrototypeWish, session: PrototypeSession) {
  if (!item.address || !item.review || !item.rating) return false;

  const reviewType: ReviewType = session.groupType === 'friends' ? 'friends' : 'couple';
  const author = resolveReviewAuthor(session);
  const places = getCommunityPlaces();
  const existingIndex = places.findIndex((place) => place.title === item.title || place.address === item.address);
  const review: PrototypeReview = {
    id: Date.now(),
    author,
    text: item.review,
    rating: item.rating,
    reviewType,
    createdAt: today(),
  };

  if (existingIndex >= 0) {
    const target = places[existingIndex];
    const nextReviews = [review, ...target.reviews];
    const nextRating = nextReviews.reduce((sum, entry) => sum + entry.rating, 0) / nextReviews.length;
    places[existingIndex] = {
      ...target,
      rating: Number(nextRating.toFixed(1)),
      reviewCount: nextReviews.length,
      reviews: nextReviews,
    };
    saveCommunityPlaces([...places]);
  } else {
    saveCommunityPlaces([
      {
        id: Date.now(),
        title: item.title,
        category: item.category,
        address: item.address,
        rating: item.rating,
        reviewCount: 1,
        lat: item.lat ?? 37.5665,
        lng: item.lng ?? 126.978,
        reviews: [review],
        sourceType: item.sourceType ?? 'community',
        sourceLabel: item.sourceLabel ?? '위시리스트 공유',
        sourceUrl: item.sourceUrl ?? null,
      },
      ...places,
    ]);
  }

  saveWishlist(
    getWishlist().map((wish) => (wish.id === item.id ? { ...wish, sharedToMap: true, reviewType } : wish))
  );

  return true;
}

export function addCommunityPlace(input: AddCommunityPlaceInput, session?: PrototypeSession) {
  const places = getCommunityPlaces();
  const created = upsertCommunityPlace(places, input, session);
  saveCommunityPlaces([...places]);
  return created;
}

export function resetPrototypeData() {
  saveSession(DEFAULT_SESSION);
  saveWishlist(DEFAULT_WISHLIST);
  saveCommunityPlaces(DEFAULT_COMMUNITY_PLACES);
}
