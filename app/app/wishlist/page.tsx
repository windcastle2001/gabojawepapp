'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getSession,
  getWishlist,
  saveWishlist,
  shareWishReviewToCommunity,
  type GroupType,
  type PrototypeSession,
  type PrototypeWish,
} from '@/lib/prototype-store';

const CATEGORIES = ['전체', '음식', '카페', '장소', '선물', '여행', '액티비티', '기타'];

const CATEGORY_EMOJI: Record<string, string> = {
  카페: '☕', 음식: '🍽️', 장소: '📍', 선물: '🎁',
  여행: '✈️', 액티비티: '🏃', 기타: '📌',
};

/* ───── 별점 컴포넌트 ───── */
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1" aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            'text-xl leading-none transition-transform',
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default',
            star <= value ? 'text-yellow-400' : 'text-gray-200'
          )}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ───── WishCard 컴포넌트 ───── */
interface WishCardProps {
  item: PrototypeWish;
  onComplete: (id: number) => void;
  onUncomplete: (id: number) => void;
  onShareToMap: (item: PrototypeWish) => void;
  groupType: GroupType;
}

function WishCard({ item, onComplete, onUncomplete, onShareToMap, groupType }: WishCardProps) {
  const isCouple = groupType === 'couple';
  const emoji = CATEGORY_EMOJI[item.category] ?? '📌';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border px-4 py-3 shadow-sm',
        item.completed ? 'border-gray-100 opacity-80' : 'border-[#F0E8EC]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0',
            item.completed ? 'bg-gray-100' : 'bg-[#FFE4EF]'
          )}
          aria-hidden
        >
          {emoji}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                item.completed
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-[#FFE4EF] text-[#FF6B9D]'
              )}
            >
              {item.category}
            </span>
            <span className="text-[10px] text-[#888]">
              {item.addedBy === 'me'
                ? '🩷 나'
                : item.addedBy === 'member'
                  ? '👥 멤버'
                  : isCouple
                  ? '💙 파트너'
                  : '👥 멤버'}
            </span>
            {item.type === 'activity' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF0E6] text-[#FB923C]">
                활동
              </span>
            )}
          </div>

          <p
            className={cn(
              'text-sm font-semibold truncate',
              item.completed ? 'line-through text-gray-400' : 'text-[#2A2A2A]'
            )}
          >
            {item.title}
          </p>

          {item.address && (
            <p className="text-xs text-[#BBB] truncate mt-0.5">📍 {item.address}</p>
          )}

          <p className="text-[10px] text-[#BBB] mt-0.5">{item.addedAt} 추가</p>

          {/* 완료 탭: 리뷰 & 별점 */}
          {item.completed && item.review && (
            <div className="mt-2 bg-gray-50 rounded-xl p-2.5">
              <StarRating value={item.rating ?? 0} />
              <p className="text-xs text-[#888] mt-1">{item.review}</p>
              {item.address && (
                <button
                  onClick={() => onShareToMap(item)}
                  disabled={item.sharedToMap}
                  className={cn(
                    'mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    item.sharedToMap
                      ? 'bg-gray-100 text-gray-400'
                      : isCouple
                        ? 'bg-brand/10 text-brand hover:bg-brand/20'
                        : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                  )}
                  aria-label="커뮤니티 맵에 리뷰 공유"
                >
                  {item.sharedToMap
                    ? '커뮤니티 맵에 공유됨'
                    : `${isCouple ? '💑 커플 리뷰' : '👥 친구 리뷰'}로 맵에 공유`}
                </button>
              )}
            </div>
          )}

          {/* 태그 */}
          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-[#888] bg-[#FFF8FA] px-2 py-0.5 rounded-full border border-[#F0E8EC]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-1 shrink-0">
          {item.completed ? (
            <button
              onClick={() => onUncomplete(item.id)}
              className="text-xs text-[#888] bg-gray-100 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors whitespace-nowrap"
              aria-label="다시 위시리스트로 되돌리기"
            >
              ↩️ 다시
            </button>
          ) : (
            <>
              <button
                onClick={() => onComplete(item.id)}
                className="w-8 h-8 rounded-xl bg-[#FFE4EF] flex items-center justify-center text-[#FF6B9D] hover:bg-[#FF6B9D] hover:text-white transition-colors"
                aria-label="완료로 표시"
              >
                ✓
              </button>
              <button
                className="w-8 h-8 rounded-xl bg-[#E3F3FF] flex items-center justify-center text-[#5BB8F5] hover:bg-[#5BB8F5] hover:text-white transition-colors"
                aria-label="공유하기"
              >
                📤
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── AddModal ───── */
interface AddModalProps {
  onClose: () => void;
  onAdd: (item: Omit<PrototypeWish, 'id' | 'completed' | 'completedAt' | 'review' | 'rating'>) => void;
}

function AddModal({ onClose, onAdd }: AddModalProps) {
  const [type, setType] = useState<'place' | 'activity'>('place');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('카페');
  const [tags, setTags] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      type,
      category,
      address: address.trim() || null,
      addedBy: 'me',
      addedAt: new Date().toISOString().split('T')[0],
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="위시리스트 추가"
    >
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* 모달 */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 animate-slide-up-sheet">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#2A2A2A]">위시리스트에 추가</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
            aria-label="모달 닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 타입 선택 */}
          <div className="flex gap-2">
            {(['place', 'activity'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                  type === t
                    ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                    : 'bg-white text-[#888] border-[#F0E8EC]'
                )}
                aria-pressed={type === t}
              >
                {t === 'place' ? '📍 장소' : '🏃 활동'}
              </button>
            ))}
          </div>

          {/* 제목 */}
          <div>
            <label className="text-xs font-semibold text-[#888] mb-1 block" htmlFor="wish-title">
              이름 *
            </label>
            <input
              id="wish-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 오르에르 성수"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#F0E8EC] text-sm outline-none focus:border-[#FF6B9D] transition-colors"
            />
          </div>

          {/* 주소 */}
          {type === 'place' && (
            <div>
              <label className="text-xs font-semibold text-[#888] mb-1 block" htmlFor="wish-address">
                주소
              </label>
              <input
                id="wish-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 서울 성동구 성수이로"
                className="w-full px-4 py-3 rounded-xl border border-[#F0E8EC] text-sm outline-none focus:border-[#FF6B9D] transition-colors"
              />
            </div>
          )}

          {/* 카테고리 */}
          <div>
            <label className="text-xs font-semibold text-[#888] mb-1 block">카테고리</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.filter((c) => c !== '전체').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border font-medium transition-colors',
                    category === cat
                      ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                      : 'bg-white text-[#888] border-[#F0E8EC]'
                  )}
                  aria-pressed={category === cat}
                >
                  {CATEGORY_EMOJI[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="text-xs font-semibold text-[#888] mb-1 block" htmlFor="wish-tags">
              태그 (쉼표로 구분)
            </label>
            <input
              id="wish-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 분위기, 인스타"
              className="w-full px-4 py-3 rounded-xl border border-[#F0E8EC] text-sm outline-none focus:border-[#FF6B9D] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#FF6B9D] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#FF6B9D]/30 active:scale-[0.98] transition-transform"
            aria-label="위시리스트에 추가하기"
          >
            💝 위시리스트에 추가
          </button>
        </form>
      </div>
    </div>
  );
}

/* ───── ReviewModal ───── */
interface ReviewModalProps {
  item: PrototypeWish;
  onClose: () => void;
  onSave: (id: number, rating: number, review: string) => void;
}

function ReviewModal({ item, onClose, onSave }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(item.id, rating, review);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="방문 후기 작성"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 animate-slide-up-sheet">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#2A2A2A]">후기 남기기</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"
            aria-label="모달 닫기"
          >
            ✕
          </button>
        </div>

        <p className="text-sm font-semibold text-[#2A2A2A] mb-4">
          {item.title}에 다녀오셨군요! 💕
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#888] mb-2 block">별점</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] mb-1 block" htmlFor="review-text">
              후기
            </label>
            <textarea
              id="review-text"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="어떠셨나요? 솔직한 후기를 남겨보세요 😊"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#F0E8EC] text-sm outline-none resize-none focus:border-[#FF6B9D] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#FF6B9D] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#FF6B9D]/30"
            aria-label="후기 저장하기"
          >
            후기 저장하기
          </button>
        </form>
      </div>
    </div>
  );
}

/* ───── 메인 페이지 ───── */
export default function WishlistPage() {
  const [activeTab, setActiveTab] = useState<'wish' | 'done'>('wish');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<PrototypeWish[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PrototypeWish | null>(null);
  const [groupType, setGroupType] = useState<GroupType>('couple');
  const [session, setSession] = useState<PrototypeSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const nextSession = getSession();
    setSession(nextSession);
    setGroupType(nextSession.groupType ?? 'couple');
    setItems(getWishlist());

    const sync = () => {
      const synced = getSession();
      setSession(synced);
      setGroupType(synced.groupType ?? 'couple');
      setItems(getWishlist());
    };
    window.addEventListener('dm-store-change', sync);
    return () => window.removeEventListener('dm-store-change', sync);
  }, []);

  function persist(nextItems: PrototypeWish[]) {
    setItems(nextItems);
    saveWishlist(nextItems);
  }

  const wishItems = items.filter((i) => !i.completed);
  const doneItems = items.filter((i) => i.completed);

  const displayItems = (activeTab === 'wish' ? wishItems : doneItems).filter((item) => {
    const matchCat = activeCategory === '전체' || item.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  function handleComplete(id: number) {
    const target = items.find((i) => i.id === id);
    if (target) setReviewTarget(target);
  }

  function handleUncomplete(id: number) {
    persist(
      items.map((i) =>
        i.id === id
          ? { ...i, completed: false, completedAt: null, review: null, rating: null }
          : i
      )
    );
  }

  function handleReviewSave(id: number, rating: number, review: string) {
    persist(
      items.map((i) =>
        i.id === id
          ? {
              ...i,
              completed: true,
              completedAt: new Date().toISOString().split('T')[0],
              review,
              rating,
            }
          : i
      )
    );
  }

  function handleAddItem(
    item: Omit<PrototypeWish, 'id' | 'completed' | 'completedAt' | 'review' | 'rating'>
  ) {
    persist([
      {
        ...item,
        id: Date.now(),
        completed: false,
        completedAt: null,
        review: null,
        rating: null,
      },
      ...items,
    ]);
  }

  function handleShareToMap(item: PrototypeWish) {
    if (!session) return;
    const ok = shareWishReviewToCommunity(item, session);
    setItems(getWishlist());
    setToast(ok ? '커뮤니티 맵에 리뷰가 공유됐어요.' : '주소와 후기가 있어야 맵에 공유할 수 있어요.');
    window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="min-h-screen bg-[#FFF8FA]">
      {/* 헤더 */}
      <header className="bg-white px-5 pt-12 pb-0 sticky top-0 z-20 border-b border-[#F0E8EC] shadow-sm">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-[#2A2A2A] mb-3">위시리스트</h1>

          {/* 탭 */}
          <div className="flex border-b border-[#F0E8EC]">
            {([
              { id: 'wish', label: `위시리스트 ${wishItems.length}` },
              { id: 'done', label: `${groupType === 'couple' ? '💑 우리' : '👥 모임'} 완료 ${doneItems.length}` },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === id
                    ? 'text-[#FF6B9D] border-[#FF6B9D]'
                    : 'text-[#BBB] border-transparent'
                )}
                aria-selected={activeTab === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 검색 + 필터 */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-[#F0E8EC] max-w-2xl mx-auto">
        {/* 검색바 */}
        <div className="flex items-center gap-2 bg-[#FFF8FA] rounded-xl border border-[#F0E8EC] px-3 py-2.5 mb-3">
          <span className="text-[#BBB] text-sm" aria-hidden>🔍</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="장소 검색"
            className="flex-1 text-sm bg-transparent outline-none text-[#2A2A2A] placeholder:text-[#BBB]"
            aria-label="위시리스트 검색"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                activeCategory === cat
                  ? 'bg-[#FF6B9D] text-white border-[#FF6B9D]'
                  : 'bg-white text-[#888] border-[#F0E8EC] hover:border-[#FF6B9D] hover:text-[#FF6B9D]'
              )}
              aria-pressed={activeCategory === cat}
            >
              {cat === '전체' ? '전체' : `${CATEGORY_EMOJI[cat] ?? ''} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* 리스트 */}
      <div className="px-5 py-4 space-y-3 max-w-2xl mx-auto">
        {displayItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3" aria-hidden>
              {activeTab === 'wish' ? '💝' : '✅'}
            </p>
            <p className="text-sm font-semibold text-[#888]">
              {activeTab === 'wish' ? '아직 위시리스트가 비어있어요' : '아직 완료된 장소가 없어요'}
            </p>
            <p className="text-xs text-[#BBB] mt-1">
              {activeTab === 'wish' ? '+ 버튼을 눌러 추가해보세요!' : '위시리스트에서 완료 표시를 해보세요!'}
            </p>
          </div>
        ) : (
          displayItems.map((item) => (
            <WishCard
              key={item.id}
              item={item}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              onShareToMap={handleShareToMap}
              groupType={groupType}
            />
          ))
        )}
      </div>

      {/* FAB 버튼 */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 md:bottom-6 w-14 h-14 bg-[#FF6B9D] text-white text-2xl rounded-full shadow-lg shadow-[#FF6B9D]/40 flex items-center justify-center z-30 active:scale-90 transition-transform hover:bg-[#e85a8c]"
        aria-label="위시리스트에 새 항목 추가"
      >
        +
      </button>

      {/* AddModal */}
      {showAddModal && (
        <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAddItem} />
      )}

      {/* ReviewModal */}
      {reviewTarget && (
        <ReviewModal
          item={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSave={handleReviewSave}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
