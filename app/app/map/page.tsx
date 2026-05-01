'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { CommunityPlace } from '@/components/map/types';
import {
  addWishFromPlace,
  getCommunityPlaces,
  type PrototypeCommunityPlace,
  type PrototypeReview,
} from '@/lib/prototype-store';

const CommunityMap = dynamic(
  () => import('@/components/map/CommunityMap').then((module) => module.CommunityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--muted))]">
        <div className="text-center">
          <p className="text-4xl" aria-hidden>
            🗺️
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      </div>
    ),
  }
);

const CATEGORIES = ['전체', '카페', '맛집', '산책', '액티비티'] as const;
const REVIEW_FILTERS = ['전체', '💑 커플 리뷰', '👥 친구 리뷰'] as const;
type ReviewFilter = (typeof REVIEW_FILTERS)[number];

function StarRating({ value }: { value: number }) {
  return (
    <span aria-label={`평점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200'}>
          ★
        </span>
      ))}
    </span>
  );
}

interface BottomSheetProps {
  place: PrototypeCommunityPlace;
  onClose: () => void;
  onAddWish: (place: PrototypeCommunityPlace) => void;
  activeReviewFilter: ReviewFilter;
}

function BottomSheet({ place, onClose, onAddWish, activeReviewFilter }: BottomSheetProps) {
  const allReviews = place.reviews ?? [];
  const reviews =
    activeReviewFilter === '전체'
      ? allReviews
      : activeReviewFilter === '💑 커플 리뷰'
        ? allReviews.filter((review) => review.reviewType === 'couple')
        : allReviews.filter((review) => review.reviewType === 'friends');

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-end">
      <div className="pointer-events-auto absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />

      <div className="pointer-events-auto relative max-h-[72vh] w-full overflow-y-auto rounded-t-[28px] bg-background shadow-2xl animate-slide-up-sheet">
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{place.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{place.address}</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              {place.category}
            </span>
            <div className="flex items-center gap-1">
              <StarRating value={place.rating} />
              <span className="text-sm font-bold text-foreground">{place.rating}</span>
              <span className="text-xs text-muted-foreground">({place.reviewCount})</span>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">최근 후기</p>
              {reviews.map((review: PrototypeReview) => (
                <div key={review.id} className="rounded-2xl bg-card p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{review.author}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        review.reviewType === 'couple' ? 'bg-brand/10 text-brand' : 'bg-secondary/10 text-secondary'
                      )}
                    >
                      {review.reviewType === 'couple' ? '💑 커플' : '👥 친구'}
                    </span>
                    <StarRating value={review.rating} />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onAddWish(place)}
              className="rounded-2xl bg-brand/10 py-3 text-sm font-semibold text-brand transition-transform active:scale-95"
            >
              위시에 추가
            </button>
            <button
              className="rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/25 transition-transform active:scale-95"
            >
              리뷰 작성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityMapPage() {
  const [places, setPlaces] = useState<PrototypeCommunityPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PrototypeCommunityPlace | null>(null);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('전체');
  const [activeReviewFilter, setActiveReviewFilter] = useState<ReviewFilter>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedToastOpen, setAddedToastOpen] = useState(false);

  useEffect(() => {
    setPlaces(getCommunityPlaces());
    const sync = () => setPlaces(getCommunityPlaces());
    window.addEventListener('dm-store-change', sync);
    return () => window.removeEventListener('dm-store-change', sync);
  }, []);

  useEffect(() => {
    if (!addedToastOpen) return;
    const timer = window.setTimeout(() => setAddedToastOpen(false), 1800);
    return () => window.clearTimeout(timer);
  }, [addedToastOpen]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchCategory = activeCategory === '전체' || place.category === activeCategory;
      const matchReview =
        activeReviewFilter === '전체' ||
        place.reviews.some((review) =>
          activeReviewFilter === '💑 커플 리뷰' ? review.reviewType === 'couple' : review.reviewType === 'friends'
        );
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        place.title.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query);

      return matchCategory && matchReview && matchSearch;
    });
  }, [activeCategory, activeReviewFilter, places, searchQuery]);

  function handleAddWish(place: PrototypeCommunityPlace) {
    const added = addWishFromPlace(place);
    if (added) setAddedToastOpen(true);
    setSelectedPlace(null);
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CommunityMap
          places={filteredPlaces as CommunityPlace[]}
          onPlaceSelect={(place) => setSelectedPlace(places.find((item) => item.id === place.id) ?? null)}
          selectedId={selectedPlace?.id ?? null}
        />
      </div>

      <div className="pointer-events-none relative z-10">
        <div className="pointer-events-auto px-4 pb-3 pt-12">
          <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 shadow-md">
            <span className="text-muted-foreground" aria-hidden>
              🔎
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="장소 이름이나 지역으로 검색"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="커뮤니티 장소 검색"
            />
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-colors',
                  activeCategory === category
                    ? 'border-brand bg-brand text-brand-foreground'
                    : 'border-border bg-background text-muted-foreground'
                )}
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto pb-1">
            {REVIEW_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveReviewFilter(filter)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-colors',
                  activeReviewFilter === filter
                    ? 'border-secondary bg-secondary text-secondary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                )}
                aria-pressed={activeReviewFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-14 flex flex-col gap-2">
          <button className="rounded-xl border border-brand/20 bg-background px-3 py-2 text-xs font-semibold text-brand shadow-md transition-colors hover:bg-brand/5">
            내 주변
          </button>
          <button className="rounded-xl border border-secondary/20 bg-background px-3 py-2 text-xs font-semibold text-secondary shadow-md transition-colors hover:bg-secondary/5">
            제보하기
          </button>
        </div>
      </div>

      {selectedPlace && (
        <BottomSheet
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddWish={handleAddWish}
          activeReviewFilter={activeReviewFilter}
        />
      )}

      {addedToastOpen && (
        <div
          className="animate-slide-up fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg"
          role="status"
          aria-live="polite"
        >
          위시리스트에 추가했어요.
        </div>
      )}
    </div>
  );
}
