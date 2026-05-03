'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, MapPinned, Plus, RotateCcw, Search, Share2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addRemoteWish, completeRemoteWish, listRemoteWishlist, reopenRemoteWish, shareRemoteWish } from '@/lib/remote-store';
import {
  addWishFromPlace,
  completeWish,
  getSession,
  getWishlist,
  saveWishlist,
  reopenWish,
  shareWishReviewToCommunity,
  type GroupType,
  type PrototypeSession,
  type PrototypeWish,
} from '@/lib/prototype-store';

const CATEGORIES = ['전체', '맛집', '카페', '산책', '액티비티', '기타'] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  맛집: '🍽',
  카페: '☕',
  산책: '🌿',
  액티비티: '🎯',
  기타: '📌',
};

const SOURCE_LABEL_STYLES: Record<string, string> = {
  community: 'bg-secondary/10 text-secondary',
  kakao_search: 'bg-warning/15 text-[#7A4A10]',
  shared_link: 'bg-brand/10 text-brand',
  manual: 'bg-muted text-muted-foreground',
};

function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className={cn('text-2xl transition-transform hover:scale-110', star <= value ? 'text-yellow-400' : 'text-gray-200')} aria-label={`${star}점`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  item,
  groupType,
  onClose,
  onSave,
}: {
  item: PrototypeWish;
  groupType: GroupType;
  onClose: () => void;
  onSave: (rating: number, review: string, shareToCommunity: boolean) => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState(item.review ?? '');
  const [shareToCommunity, setShareToCommunity] = useState(Boolean(item.address));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">완료하고 후기 남기기</h2>
            <p className="mt-1 text-xs text-muted-foreground">{item.title}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">평점</p>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={4} placeholder="분위기, 이동, 다시 가고 싶은지 적어보세요." className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand" />
          {item.address ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <input type="checkbox" checked={shareToCommunity} onChange={(event) => setShareToCommunity(event.target.checked)} className="mt-1" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {groupType === 'couple' ? '커플 리뷰로 커뮤니티 맵에 공유' : '친구 리뷰로 커뮤니티 맵에 공유'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">저장과 동시에 지도에 핀이 추가되고 다른 사용자도 볼 수 있어요.</p>
              </div>
            </label>
          ) : null}
          <button onClick={() => onSave(rating, review, shareToCommunity)} className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/25">
            완료 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function AddWishModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (payload: { title: string; category: string; address: string | null; tags: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('카페');
  const [address, setAddress] = useState('');
  const [tags, setTags] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl md:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">위시리스트에 직접 추가</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-label="닫기">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand" placeholder="이름" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((item) => item !== '전체').map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', category === item ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-card text-muted-foreground')}>
                {item}
              </button>
            ))}
          </div>
          <input value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand" placeholder="주소, 없으면 비워두기" />
          <input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand" placeholder="태그, 쉼표로 구분" />
          <button
            onClick={() => {
              if (!title.trim()) return;
              onAdd({
                title: title.trim(),
                category,
                address: address.trim() || null,
                tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
              });
              onClose();
            }}
            className="w-full rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/25"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function WishCard({
  item,
  groupType,
  onCompleteClick,
  onReopen,
  onShareToMap,
}: {
  item: PrototypeWish;
  groupType: GroupType;
  onCompleteClick: (item: PrototypeWish) => void;
  onReopen: (id: number | string) => void;
  onShareToMap: (item: PrototypeWish) => void;
}) {
  const categoryEmoji = CATEGORY_EMOJI[item.category] ?? '📍';
  const sourceClass = SOURCE_LABEL_STYLES[item.sourceType ?? 'manual'] ?? SOURCE_LABEL_STYLES.manual;

  return (
    <div className="rounded-3xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl', item.completed ? 'bg-muted' : 'bg-brand/10')}>
          {categoryEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">{item.category}</span>
            {item.sourceLabel ? <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sourceClass)}>{item.sourceLabel}</span> : null}
            {item.sharedToMap ? <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">맵 공유됨</span> : null}
          </div>
          <p className={cn('text-sm font-semibold text-foreground', item.completed && 'text-muted-foreground line-through')}>{item.title}</p>
          {item.address ? <p className="mt-1 text-xs text-muted-foreground">{item.address}</p> : null}
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
            <span>{item.addedBy === 'me' ? '내가 저장' : item.addedBy === 'partner' ? '상대 저장' : '멤버 저장'}</span>
            <span>·</span>
            <span>{item.addedAt}</span>
          </div>
          {item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">#{tag}</span>)}
            </div>
          ) : null}
          {item.completed && item.review ? (
            <div className="mt-3 rounded-2xl bg-background px-3 py-3">
              <div className="mb-1 flex items-center gap-1 text-yellow-400">
                {'★'.repeat(item.rating ?? 0)}
                <span className="ml-1 text-xs text-foreground">{item.rating}점</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.review}</p>
              {item.address ? (
                <button onClick={() => onShareToMap(item)} disabled={item.sharedToMap} className={cn('mt-3 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold', item.sharedToMap ? 'bg-muted text-muted-foreground' : groupType === 'couple' ? 'bg-brand/10 text-brand' : 'bg-secondary/10 text-secondary')}>
                  <MapPinned className="h-3.5 w-3.5" />
                  {item.sharedToMap ? '커뮤니티 맵에 공유됨' : '커뮤니티 맵에 공유하기'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {item.completed ? (
            <button onClick={() => onReopen(item.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-label="다시 위시로 돌리기">
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => onCompleteClick(item)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand" aria-label="완료로 표시">
              <Check className="h-4 w-4" />
            </button>
          )}
          {item.sourceUrl ? (
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary" aria-label="원본 링크 열기">
              <Share2 className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const [session, setSession] = useState<PrototypeSession | null>(null);
  const [groupType, setGroupType] = useState<GroupType>('couple');
  const [items, setItems] = useState<PrototypeWish[]>([]);
  const [activeTab, setActiveTab] = useState<'wish' | 'done'>('wish');
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PrototypeWish | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const sync = () => {
      const nextSession = getSession();
      setSession(nextSession);
      setGroupType(nextSession.groupType ?? 'couple');
      if (nextSession.authMode === 'google') {
        listRemoteWishlist()
          .then((remoteItems) => setItems(remoteItems))
          .catch(() => setItems(getWishlist()));
      } else {
        setItems(getWishlist());
      }
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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const filteredItems = useMemo(() => {
    const source = activeTab === 'wish' ? items.filter((item) => !item.completed) : items.filter((item) => item.completed);
    return source.filter((item) => {
      const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.address?.toLowerCase().includes(query) || item.sourceLabel?.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, activeTab, items, searchQuery]);

  const pendingCount = items.filter((item) => !item.completed).length;
  const doneCount = items.filter((item) => item.completed).length;

  async function refreshWishlist() {
    if (session?.authMode === 'google') {
      try {
        setItems(await listRemoteWishlist());
        return;
      } catch {
        setToast('서버 위시를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    }
    setItems(getWishlist());
  }

  async function handleAddManualWish(payload: { title: string; category: string; address: string | null; tags: string[] }) {
    if (session?.authMode === 'google') {
      await addRemoteWish({ ...payload, sourceType: 'manual', sourceLabel: '직접 저장', sourceUrl: null, type: payload.address ? 'place' : 'activity' });
      await refreshWishlist();
      setToast('위시리스트에 추가했어요.');
      return;
    }
    const added = addWishFromPlace({ ...payload, sourceType: 'manual', sourceLabel: '직접 저장', sourceUrl: null, type: payload.address ? 'place' : 'activity' });
    if (added) {
      void refreshWishlist();
      setToast('위시리스트에 추가했어요.');
    }
  }

  async function handleCompleteSave(rating: number, review: string, shareToCommunity: boolean) {
    if (!reviewTarget || !session) return;
    if (session.authMode === 'google') {
      const completed = await completeRemoteWish(String(reviewTarget.id), rating, review);
      if (shareToCommunity) await shareRemoteWish(String(completed.id));
      await refreshWishlist();
      setToast(shareToCommunity ? '후기를 커뮤니티 맵에 공유했어요.' : '완료 목록으로 옮겼어요.');
      setReviewTarget(null);
      setActiveTab('done');
      return;
    }
    const completed = completeWish(reviewTarget.id, rating, review);
    let shareTarget = completed;
    if (completed && completed.address && (!completed.lat || !completed.lng) && userLocation) {
      shareTarget = { ...completed, lat: userLocation.lat, lng: userLocation.lng };
      saveWishlist(getWishlist().map((item) => (item.id === completed.id ? shareTarget! : item)));
    }
    void refreshWishlist();
    if (completed && shareToCommunity) {
      const shared = shareTarget ? shareWishReviewToCommunity(shareTarget, session) : false;
      void refreshWishlist();
      setToast(shared ? '후기를 커뮤니티 맵에 공유했어요. 지도에 핀이 추가됩니다.' : '주소와 후기가 있어야 맵에 공유할 수 있어요.');
    } else {
      setToast('완료 목록으로 옮겼어요.');
    }
    setReviewTarget(null);
    setActiveTab('done');
  }

  async function handleReopen(id: number | string) {
    if (session?.authMode === 'google') {
      await reopenRemoteWish(String(id));
      await refreshWishlist();
      setToast('다시 위시리스트로 돌렸어요.');
      setActiveTab('wish');
      return;
    }
    reopenWish(id);
    void refreshWishlist();
    setToast('다시 위시리스트로 돌렸어요.');
    setActiveTab('wish');
  }

  async function handleShareToMap(item: PrototypeWish) {
    if (!session) return;
    if (session.authMode === 'google') {
      try {
        await shareRemoteWish(String(item.id));
        await refreshWishlist();
        setToast('커뮤니티 맵에 공유했어요.');
      } catch (error) {
        setToast(error instanceof Error ? error.message : '커뮤니티 맵에 공유하지 못했어요.');
      }
      return;
    }
    let shareTarget = item;
    if (item.address && (!item.lat || !item.lng) && userLocation) {
      shareTarget = { ...item, lat: userLocation.lat, lng: userLocation.lng };
      saveWishlist(getWishlist().map((wish) => (wish.id === item.id ? shareTarget : wish)));
    }
    const ok = shareWishReviewToCommunity(shareTarget, session);
    refreshWishlist();
    setToast(ok ? '커뮤니티 맵에 공유했어요.' : '주소와 후기가 있어야 커뮤니티 맵에 공유할 수 있어요.');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-5 pb-4 pt-12 shadow-sm">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-black text-foreground">위시리스트</h1>
          <p className="mt-1 text-xs text-muted-foreground">지도 검색, 공유 링크, 직접 입력으로 저장한 장소를 한 번에 관리합니다.</p>
          <div className="mt-4 flex gap-2">
            {[
              { key: 'wish', label: `위시 ${pendingCount}` },
              { key: 'done', label: `완료 ${doneCount}` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as 'wish' | 'done')} className={cn('rounded-full px-4 py-2 text-sm font-semibold', activeTab === tab.key ? 'bg-brand text-brand-foreground' : 'bg-background text-muted-foreground border border-border')}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-4">
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="장소, 주소, 저장 경로로 검색" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-semibold', activeCategory === category ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-card text-muted-foreground')}>
              {category === '전체' ? '전체' : `${CATEGORY_EMOJI[category] ?? '📍'} ${category}`}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <p className="text-sm font-semibold text-foreground">{activeTab === 'wish' ? '아직 위시리스트가 비어 있어요' : '완료한 장소가 아직 없어요'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activeTab === 'wish' ? '지도에서 추가하거나 직접 저장해 보세요.' : '위시를 완료 처리하면 여기에 모입니다.'}</p>
            </div>
          ) : (
            filteredItems.map((item) => <WishCard key={item.id} item={item} groupType={groupType} onCompleteClick={setReviewTarget} onReopen={handleReopen} onShareToMap={handleShareToMap} />)
          )}
        </div>
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/35 md:bottom-6" aria-label="직접 추가">
        <Plus className="h-6 w-6" />
      </button>
      {showAddModal ? <AddWishModal onClose={() => setShowAddModal(false)} onAdd={handleAddManualWish} /> : null}
      {reviewTarget ? <ReviewModal item={reviewTarget} groupType={groupType} onClose={() => setReviewTarget(null)} onSave={handleCompleteSave} /> : null}
      {toast ? <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg">{toast}</div> : null}
    </div>
  );
}
