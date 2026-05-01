'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, buttonVariants } from '@/components/ui';
import {
  getSession,
  getWishlist,
  saveSession,
  type PrototypeSession,
  type PrototypeWish,
} from '@/lib/prototype-store';

const CATEGORY_EMOJI: Record<string, string> = {
  카페: '☕',
  맛집: '🍽',
  산책: '🌿',
  문화: '🎨',
  액티비티: '🎟',
};

function formatConnectedLabel(connectedAt: string | null) {
  if (!connectedAt) return null;
  const started = new Date(connectedAt);
  const diff = Math.floor((Date.now() - started.getTime()) / (1000 * 60 * 60 * 24));
  return `D+${Math.max(diff, 0)}`;
}

function WishPreviewCard({ item }: { item: PrototypeWish }) {
  const emoji = CATEGORY_EMOJI[item.category] ?? '📍';

  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xl" aria-hidden>
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <Badge>{item.category}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {item.addedBy === 'me' ? '나' : item.addedBy === 'member' ? '멤버' : '상대'}
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
        {item.address && <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.address}</p>}
      </div>
    </Card>
  );
}

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [session, setSession] = useState<PrototypeSession>(getSession());
  const [wishlist, setWishlist] = useState<PrototypeWish[]>(getWishlist());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      setWishlist(getWishlist());
    };
    sync();
    window.addEventListener('dm-store-change', sync);
    return () => window.removeEventListener('dm-store-change', sync);
  }, []);

  const isDemo = session.authMode === 'guest';
  const isCouple = session.groupType === 'couple';
  const inviteReady = isCouple ? !session.partnerAccepted : session.friendMembers < 10;
  const recentWishlist = wishlist.filter((item) => !item.completed).slice(0, 3);
  const connectedLabel = formatConnectedLabel(session.connectedAt);

  function simulateInviteAccept() {
    const next = isCouple
      ? { ...session, partnerAccepted: true, connectedAt: new Date().toISOString().split('T')[0] }
      : { ...session, friendMembers: Math.min(10, session.friendMembers + 1) };
    saveSession(next);
    setSession(next);
  }

  function handleDisconnect() {
    const next = isCouple
      ? { ...session, partnerAccepted: false, connectedAt: null, inviteCode: 'DM-4821' }
      : { ...session, friendMembers: 1, inviteCode: 'FR-7392' };
    saveSession(next);
    setSession(next);
  }

  function handleParse() {
    if (!inputValue.trim() || isParsing) return;
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setInputValue('');
      textareaRef.current?.blur();
    }, 1200);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleParse();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-5 pb-4 pt-12 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {isCouple ? '💑' : '👥'}
              </span>
              <h1 className="text-lg font-black text-foreground">
                {isCouple
                  ? session.partnerAccepted
                    ? '커플 연결 완료'
                    : '커플 초대 대기'
                  : '친구 약속 공간'}
              </h1>
            </div>
            <p className={cn('mt-0.5 text-xs font-bold', isCouple ? 'text-brand' : 'text-secondary')}>
              {isCouple
                ? session.partnerAccepted
                  ? `${connectedLabel ?? '연결 완료'} 함께 쓰는 공간`
                  : `초대코드 ${session.inviteCode}`
                : `친구 ${session.friendMembers}/10명 참여 중`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isCouple
                ? session.partnerAccepted
                  ? '둘이 함께 저장하고 리뷰를 남길 수 있어요.'
                  : '상대가 수락하면 초대 버튼은 사라지고 연결 상태로 전환돼요.'
                : '친구들과 장소를 모으고, 친구 리뷰로 공유할 수 있어요.'}
            </p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              isCouple ? 'bg-brand/10 text-brand' : 'bg-secondary/10 text-secondary'
            )}
            aria-label="현재 공간 상태"
          >
            <span className="text-sm font-bold">{isCouple ? '짝' : '팀'}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <section>
          <Card className="overflow-hidden">
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="링크, 주소, 또는 '성수에서 조용한 카페 가고 싶어'처럼 떠오른 걸 적어보세요."
                className="min-h-[80px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                rows={3}
                aria-label="장소 또는 텍스트 입력"
              />
            </div>

            <div className="flex flex-wrap gap-2 px-4 pb-4">
              {[
                { label: '링크 붙여넣기', demo: false },
                { label: '직접 입력', demo: false },
                { label: isDemo ? 'AI 추천 보기' : 'AI 추천 받기', demo: true },
              ].map(({ label, demo }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (demo && isDemo) return;
                    textareaRef.current?.focus();
                  }}
                  disabled={demo && isDemo}
                  className={cn(
                    'min-h-10 rounded-full border px-3 text-xs font-medium transition-colors',
                    demo && isDemo
                      ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-brand hover:bg-brand/10 hover:text-brand'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {inputValue.trim() && (
              <div className="flex justify-end px-4 pb-4">
                <Button onClick={handleParse} disabled={isParsing} isLoading={isParsing} className="active:scale-95">
                  {isParsing ? '정리 중...' : '저장하기'}
                </Button>
              </div>
            )}
          </Card>
        </section>

        {session.authMode === 'google' && (
          <section>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {inviteReady
                      ? isCouple
                        ? '파트너 초대가 필요해요'
                        : '친구를 더 초대할 수 있어요'
                      : isCouple
                        ? '커플 연결이 완료됐어요'
                        : '친구 모임이 준비됐어요'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inviteReady
                      ? `초대코드 ${session.inviteCode} · ${isCouple ? '수락되면 연결 상태로 바뀝니다.' : '최대 10명까지 함께 사용할 수 있어요.'}`
                      : isCouple
                        ? `${connectedLabel ?? '연결 완료'} · 필요하면 언제든 연결을 해제할 수 있어요.`
                        : `현재 ${session.friendMembers}명이 함께 쓰고 있어요.`}
                  </p>
                </div>

                <div className="flex gap-2">
                  {inviteReady ? (
                    <Button size="sm" variant={isCouple ? 'default' : 'secondary'} onClick={simulateInviteAccept}>
                      {isCouple ? '수락 상태로 전환' : '+1명 추가'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleDisconnect}>
                      {isCouple ? '연결 해제' : '모임 초기화'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">최근 저장한 장소</h2>
            <Link href="/app/wishlist" className="text-xs font-semibold text-brand" aria-label="위시리스트 전체 보기">
              전체 보기 →
            </Link>
          </div>
          <div className="space-y-2">
            {recentWishlist.map((item) => (
              <WishPreviewCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section>
          <div className={cn('rounded-2xl p-5', isCouple ? 'bg-brand/10' : 'bg-secondary/10')}>
            <p className={cn('mb-1 text-xs font-semibold', isCouple ? 'text-brand' : 'text-secondary')}>
              {isCouple ? 'AI 데이트 코스' : 'AI 모임 코스'}
            </p>
            <h3 className="mb-3 text-base font-bold text-foreground">오늘 어디로 갈지 같이 골라볼까요?</h3>
            {isDemo ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-card/60 text-sm font-semibold text-muted-foreground"
                >
                  AI 추천은 로그인 후 사용할 수 있어요
                </button>
                <Link
                  href="/login"
                  className={cn('block text-center text-xs font-medium', isCouple ? 'text-brand' : 'text-secondary')}
                >
                  Google로 로그인하면 초대와 AI 추천까지 이어서 사용할 수 있어요
                </Link>
              </div>
            ) : (
              <Link
                href="/app/ai"
                className={cn(buttonVariants({ variant: isCouple ? 'default' : 'secondary' }), 'w-full active:scale-95')}
              >
                {isCouple ? 'AI 데이트 코스 추천 받기' : 'AI 모임 코스 추천 받기'}
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
