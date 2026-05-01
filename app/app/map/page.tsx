'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocateFixed, MapPinPlus, Search, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommunityPlace } from '@/components/map/types';
import {
  addCommunityPlace,
  addWishFromPlace,
  getCommunityPlaces,
  getSession,
  type AddCommunityPlaceInput,
  type PrototypeCommunityPlace,
  type PrototypeReview,
  type PrototypeSession,
} from '@/lib/prototype-store';

const CommunityMap = dynamic(() => import('@/components/map/CommunityMap').then((module) => module.CommunityMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--muted))]">
      <div className="text-center">
        <p className="text-4xl" aria-hidden>
          📍
        </p>
        <p className="mt-2 text-sm font-medium text-muted-foreground">지도를 불러오는 중...</p>
      </div>
    </div>
  ),
});

type ReviewFilter = '전체' | '커플 리뷰' | '친구 리뷰';

interface KakaoSearchResult {
  id: string;
  title: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  sourceUrl: string;
}

interface ReportModalProps {
  initialValue?: Partial<AddCommunityPlaceInput>;
  onClose: () => void;
  onSubmit: (value: AddCommunityPlaceInput, saveWish: boolean) => void;
}

const CATEGORIES = ['전체', '카페', '맛집', '산책', '액티비티'] as const;
const REVIEW_FILTERS: ReviewFilter[] = ['전체', '커플 리뷰', '친구 리뷰'];
const NEARBY_RADIUS_KM = 3;

function toCategoryLabel(category: string) {
  if (category.includes('카페')) return '카페';
  if (category.includes('음식') || category.includes('식당') || category.includes('맛집')) return '맛집';
  if (category.includes('공원') || category.includes('산책')) return '산책';
  return '액티비티';
}

function getDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

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

function ReportModal({ initialValue, onClose, onSubmit }: ReportModalProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [category, setCategory] = useState(initialValue?.category ?? '카페');
  const [address, setAddress] = useState(initialValue?.address ?? '');
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [saveWish, setSaveWish] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">커뮤니티 맵에 제보하기</h2>
            <p className="mt-1 text-xs text-muted-foreground">새 장소를 직접 등록하거나 링크 정보를 보정할 수 있어요.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">장소 이름</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
              placeholder="예: 성수 루프탑 카페"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((item) => item !== '전체').map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold',
                    category === item ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">주소</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
              placeholder="주소나 지역명을 적어주세요."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">짧은 메모</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
              placeholder="왜 추천하는지 한 줄 메모를 남겨주세요."
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <input type="checkbox" checked={saveWish} onChange={(event) => setSaveWish(event.target.checked)} className="mt-1" />
            <div>
              <p className="text-sm font-semibold text-foreground">내 위시리스트에도 같이 저장</p>
              <p className="mt-1 text-xs text-muted-foreground">제보와 동시에 내 일정 후보에도 넣습니다.</p>
            </div>
          </label>

          <button
            onClick={() => {
              if (!title.trim() || !address.trim()) return;
              onSubmit(
                {
                  title: title.trim(),
                  category,
                  address: address.trim(),
                  note: note.trim(),
                  lat: initialValue?.lat,
                  lng: initialValue?.lng,
                  sourceType: initialValue?.sourceType ?? 'manual',
                  sourceLabel: initialValue?.sourceLabel ?? '제보 등록',
                  sourceUrl: initialValue?.sourceUrl ?? null,
                },
                saveWish
              );
            }}
            className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/25"
          >
            제보 등록
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchResultSheet({
  results,
  onAddWish,
  onReport,
  onClose,
}: {
  results: KakaoSearchResult[];
  onAddWish: (item: KakaoSearchResult) => void;
  onReport: (item: KakaoSearchResult) => void;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="pointer-events-auto w-full max-w-2xl rounded-t-[28px] bg-background px-5 pb-8 pt-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">검색 결과</p>
            <p className="mt-1 text-xs text-muted-foreground">카카오맵 검색 결과에서 바로 위시 저장이나 제보를 할 수 있어요.</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-muted p-2 text-muted-foreground" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {results.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-[#7A4A10]">카카오 검색</span>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">{item.category}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.address}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => onAddWish(item)} className="rounded-xl bg-brand/10 px-3 py-2 text-xs font-semibold text-brand">
                  위시에 추가
                </button>
                <button onClick={() => onReport(item)} className="rounded-xl bg-secondary/10 px-3 py-2 text-xs font-semibold text-secondary">
                  커뮤니티 맵에 제보
                </button>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"
                >
                  원본 보기
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
      : activeReviewFilter === '커플 리뷰'
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
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{place.category}</span>
            <div className="flex items-center gap-1">
              <StarRating value={place.rating} />
              <span className="text-sm font-bold text-foreground">{place.rating}</span>
              <span className="text-xs text-muted-foreground">({place.reviewCount})</span>
            </div>
          </div>

          {reviews.length > 0 ? (
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
                      {review.reviewType === 'couple' ? '커플 리뷰' : '친구 리뷰'}
                    </span>
                    <StarRating value={review.rating} />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-2xl bg-card px-4 py-4 text-xs text-muted-foreground">아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onAddWish(place)} className="rounded-2xl bg-brand/10 py-3 text-sm font-semibold text-brand">
              위시에 추가
            </button>
            <a
              href={`https://map.kakao.com/link/map/${encodeURIComponent(place.title)},${place.lat},${place.lng}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-brand py-3 text-center text-sm font-semibold text-brand-foreground shadow-md shadow-brand/25"
            >
              카카오맵 열기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

async function searchPlacesWithKakao(query: string) {
  if (!window.kakao?.maps?.services?.Places || !window.kakao.maps.services.Status) {
    throw new Error('카카오 검색 서비스가 아직 준비되지 않았습니다.');
  }

  return new Promise<KakaoSearchResult[]>((resolve, reject) => {
    const service = new window.kakao!.maps.services!.Places();
    service.keywordSearch(query, (data, status) => {
      if (status === window.kakao!.maps.services!.Status.OK) {
        resolve(
          data.map((item) => ({
            id: item.id,
            title: item.place_name,
            category: toCategoryLabel(item.category_name),
            address: item.road_address_name || item.address_name,
            lat: Number(item.y),
            lng: Number(item.x),
            sourceUrl: item.place_url,
          }))
        );
        return;
      }

      if (status === window.kakao!.maps.services!.Status.ZERO_RESULT) {
        resolve([]);
        return;
      }

      reject(new Error('카카오 장소 검색에 실패했습니다.'));
    });
  });
}

export default function CommunityMapPage() {
  const [session, setSession] = useState<PrototypeSession | null>(null);
  const [places, setPlaces] = useState<PrototypeCommunityPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PrototypeCommunityPlace | null>(null);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('전체');
  const [activeReviewFilter, setActiveReviewFilter] = useState<ReviewFilter>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoSearchResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDraft, setReportDraft] = useState<Partial<AddCommunityPlaceInput> | undefined>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      setPlaces(getCommunityPlaces());
    };
    sync();
    window.addEventListener('dm-store-change', sync);
    return () => window.removeEventListener('dm-store-change', sync);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchCategory = activeCategory === '전체' || place.category === activeCategory;
      const matchReview =
        activeReviewFilter === '전체' ||
        place.reviews.some((review) =>
          activeReviewFilter === '커플 리뷰' ? review.reviewType === 'couple' : review.reviewType === 'friends'
        );
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        place.title.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query);
      const matchNearby =
        !nearbyOnly || !userLocation || getDistanceKm(userLocation, { lat: place.lat, lng: place.lng }) <= NEARBY_RADIUS_KM;

      return matchCategory && matchReview && matchSearch && matchNearby;
    });
  }, [activeCategory, activeReviewFilter, nearbyOnly, places, searchQuery, userLocation]);

  function handleAddWish(place: {
    title: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
    sourceUrl?: string | null;
  }) {
    const added = addWishFromPlace({
      title: place.title,
      category: place.category,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      tags: ['커뮤니티맵'],
      sourceType: 'community',
      sourceLabel: '커뮤니티 맵',
      sourceUrl: place.sourceUrl ?? null,
    });
    setToast(added ? '위시리스트에 추가했어요.' : '이미 위시리스트에 있는 장소예요.');
    setSelectedPlace(null);
  }

  function handleNearMe() {
    if (!navigator.geolocation) {
      setToast('이 브라우저에서는 위치 정보를 사용할 수 없어요.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearbyOnly((current) => !current || !userLocation);
        setToast('내 주변 기준으로 필터링했어요.');
      },
      () => {
        setToast('위치 권한을 허용해야 내 주변 필터를 쓸 수 있어요.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSearchSubmit() {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      setIsSearching(true);
      try {
        const response = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await response.json();
        if (!response.ok || !data.data) {
          setToast(data.error ?? '링크를 분석하지 못했어요.');
          return;
        }

        const payload = data.data as {
          title: string;
          category: string;
          address?: string;
          lat?: number;
          lng?: number;
          source_url: string;
          source_type: string;
          tags?: string[];
        };

        setReportDraft({
          title: payload.title,
          category: toCategoryLabel(payload.category),
          address: payload.address ?? '',
          lat: payload.lat,
          lng: payload.lng,
          note: '',
          sourceType: 'shared_link',
          sourceLabel: '공유 링크',
          sourceUrl: payload.source_url,
        });
        setShowReportModal(true);
        setSearchResults([]);
      } catch {
        setToast('링크를 처리하는 중 오류가 났어요.');
      } finally {
        setIsSearching(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlacesWithKakao(trimmed);
      setSearchResults(results);
      setToast(results.length > 0 ? '카카오 검색 결과를 불러왔어요.' : '검색 결과가 없어요.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : '검색에 실패했어요.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleReportSubmit(value: AddCommunityPlaceInput, saveWish: boolean) {
    const created = addCommunityPlace(value, session ?? undefined);
    if (saveWish) {
      addWishFromPlace({
        title: created.title,
        category: created.category,
        address: created.address,
        lat: created.lat,
        lng: created.lng,
        tags: ['커뮤니티맵'],
        sourceType: value.sourceType ?? 'manual',
        sourceLabel: value.sourceLabel ?? '제보 등록',
        sourceUrl: value.sourceUrl ?? null,
      });
    }
    setToast(saveWish ? '커뮤니티 맵과 위시리스트에 같이 저장했어요.' : '커뮤니티 맵에 제보를 등록했어요.');
    setShowReportModal(false);
    setReportDraft(undefined);
  }

  function openReportForResult(result?: KakaoSearchResult) {
    if (result) {
      setReportDraft({
        title: result.title,
        category: result.category,
        address: result.address,
        lat: result.lat,
        lng: result.lng,
        note: '',
        sourceType: 'kakao_search',
        sourceLabel: '카카오 검색',
        sourceUrl: result.sourceUrl,
      });
    } else {
      setReportDraft(undefined);
    }
    setShowReportModal(true);
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
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder="장소 이름, 지역, 네이버/카카오 링크로 검색"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="장소 검색"
            />
            <button
              onClick={handleSearchSubmit}
              className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground"
            >
              {isSearching ? '검색 중' : '검색'}
            </button>
          </div>

          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-colors',
                  activeCategory === category ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-background text-muted-foreground'
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
          <button
            onClick={handleNearMe}
            className={cn(
              'rounded-xl border bg-background px-3 py-2 text-xs font-semibold shadow-md transition-colors',
              nearbyOnly ? 'border-brand bg-brand/5 text-brand' : 'border-brand/20 text-brand hover:bg-brand/5'
            )}
          >
            <span className="inline-flex items-center gap-1">
              <LocateFixed className="h-3.5 w-3.5" />
              {nearbyOnly ? '내 주변 해제' : '내 주변'}
            </span>
          </button>
          <button
            onClick={() => openReportForResult()}
            className="rounded-xl border border-secondary/20 bg-background px-3 py-2 text-xs font-semibold text-secondary shadow-md transition-colors hover:bg-secondary/5"
          >
            <span className="inline-flex items-center gap-1">
              <MapPinPlus className="h-3.5 w-3.5" />
              제보하기
            </span>
          </button>
        </div>
      </div>

      {selectedPlace ? <BottomSheet place={selectedPlace} onClose={() => setSelectedPlace(null)} onAddWish={handleAddWish} activeReviewFilter={activeReviewFilter} /> : null}
      {searchResults.length > 0 ? (
        <SearchResultSheet
          results={searchResults}
          onAddWish={handleAddWish}
          onReport={(item) => openReportForResult(item)}
          onClose={() => setSearchResults([])}
        />
      ) : null}
      {showReportModal ? <ReportModal initialValue={reportDraft} onClose={() => setShowReportModal(false)} onSubmit={handleReportSubmit} /> : null}

      {toast ? (
        <div className="animate-slide-up fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
