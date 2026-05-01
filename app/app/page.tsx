'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, LinkIcon, Map, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, buttonVariants } from '@/components/ui';
import {
  addWishFromPlace,
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
  액티비티: '🎯',
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
  const [toast, setToast] = useState<string | null>(null);
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isDemo = session.authMode === 'guest';
  const isCouple = session.groupType === 'couple';
  const isConnected = isCouple ? session.partnerAccepted : session.friendMembers > 1;
  const recentWishlist = wishlist.filter((item) => !item.completed).slice(0, 3);
  const connectedLabel = formatConnectedLabel(session.connectedAt);
  const inviteUrl = session.inviteUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/join/${session.inviteCode}` : '');

  async function copyInvite() {
    await navigator.clipboard?.writeText(inviteUrl).catch(() => undefined);
    setToast('초대 링크를 복사했어요.');
  }

  function handleDisconnect() {
    const next = isCouple ? { ...session, partnerAccepted: false, connectedAt: null } : { ...session, friendMembers: 1, connectedAt: null };
    saveSession(next);
    setSession(next);
    setToast(isCouple ? '커플 연결을 해제했어요.' : '모임을 혼자 쓰는 상태로 바꿨어요.');
  }

  async function handleParse() {
    const raw = inputValue.trim();
    if (!raw || isParsing) return;
    setIsParsing(true);

    try {
      if (/^https?:\/\//i.test(raw)) {
        const response = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: raw }),
        });
        const data = await response.json();
        if (!response.ok || !data.data) throw new Error(data.error ?? '링크를 분석하지 못했어요.');

        addWishFromPlace({
          title: data.data.title,
          category: data.data.category ?? '액티비티',
          address: data.data.address ?? null,
          lat: data.data.lat,
          lng: data.data.lng,
          tags: data.data.tags ?? [],
          sourceType: 'shared_link',
          sourceLabel: '공유 링크',
          sourceUrl: data.data.source_url ?? raw,
        });
        setToast('링크를 분석해서 위시리스트에 저장했어요.');
      } else {
        addWishFromPlace({
          title: raw,
          category: '액티비티',
          address: null,
          tags: ['직접입력'],
          sourceType: 'manual',
          sourceLabel: '직접 입력',
        });
        setToast('위시리스트에 저장했어요.');
      }

      setInputValue('');
      textareaRef.current?.blur();
      setWishlist(getWishlist());
    } catch (error) {
      setToast(error instanceof Error ? error.message : '저장 중 문제가 생겼어요.');
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-5 pb-4 pt-12 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{isCouple ? '♡' : '👥'}</span>
              <h1 className="text-lg font-black text-foreground">
                {isCouple ? (isConnected ? '커플 공간' : '커플 초대 대기') : '친구 모임 공간'}
              </h1>
            </div>
            <p className={cn('mt-0.5 text-xs font-bold', isCouple ? 'text-brand' : 'text-secondary')}>
              {isCouple ? (isConnected ? `${connectedLabel ?? '연결 완료'} 함께 쓰는 중` : `초대코드 ${session.inviteCode}`) : `친구 ${session.friendMembers}/10명 참여 중`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isConnected ? '함께 저장하고 리뷰를 공유할 수 있어요.' : '초대 링크를 보내면 상대가 수락한 뒤 같은 공간을 쓸 수 있어요.'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <Card className="overflow-hidden">
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleParse();
                }
              }}
              placeholder="카카오맵/네이버지도 링크나 '성수 조용한 카페 가고 싶어' 같은 메모를 붙여넣어 보세요."
              className="min-h-[86px] w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              rows={3}
              aria-label="장소 또는 링크 입력"
            />
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            <button onClick={() => textareaRef.current?.focus()} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand">
              <LinkIcon className="h-3.5 w-3.5" /> 링크 붙여넣기
            </button>
            <Link href="/app/map" className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand">
              <Map className="h-3.5 w-3.5" /> 지도에서 찾기
            </Link>
            <Link href="/app/ai" className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:border-brand hover:text-brand">
              <Bot className="h-3.5 w-3.5" /> AI에게 묻기
            </Link>
          </div>
          {inputValue.trim() && (
            <div className="flex justify-end px-4 pb-4">
              <Button onClick={handleParse} disabled={isParsing} isLoading={isParsing} className="active:scale-95">
                저장하기
              </Button>
            </div>
          )}
        </Card>

        {session.authMode === 'google' && (
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">{isConnected ? '같이 쓰는 공간이에요' : '초대가 필요해요'}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isConnected ? '필요하면 연결을 해제하고 다시 초대할 수 있어요.' : `초대코드 ${session.inviteCode} · 링크를 보내면 실제 계정으로 수락할 수 있어요.`}
                </p>
              </div>
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button size="sm" variant={isCouple ? 'default' : 'secondary'} onClick={copyInvite}>
                    <Share2 className="h-3.5 w-3.5" /> 초대 링크 복사
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleDisconnect}>
                    연결 해제
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">최근 저장한 장소</h2>
            <Link href="/app/wishlist" className="text-xs font-semibold text-brand" aria-label="위시리스트 전체 보기">전체 보기 →</Link>
          </div>
          <div className="space-y-2">
            {recentWishlist.length ? recentWishlist.map((item) => <WishPreviewCard key={item.id} item={item} />) : (
              <Card className="p-5 text-center text-sm text-muted-foreground">아직 저장한 장소가 없어요.</Card>
            )}
          </div>
        </section>

        <section className={cn('rounded-2xl p-5', isCouple ? 'bg-brand/10' : 'bg-secondary/10')}>
          <p className={cn('mb-1 text-xs font-semibold', isCouple ? 'text-brand' : 'text-secondary')}>AI 추천</p>
          <h3 className="mb-3 text-base font-bold text-foreground">오늘 어디로 갈지 같이 골라볼까요?</h3>
          {isDemo ? (
            <Link href="/login" className={cn(buttonVariants({ variant: isCouple ? 'default' : 'secondary' }), 'w-full')}>
              로그인하고 AI 추천 쓰기
            </Link>
          ) : (
            <Link href="/app/ai" className={cn(buttonVariants({ variant: isCouple ? 'default' : 'secondary' }), 'w-full active:scale-95')}>
              AI 코스 추천 받기
            </Link>
          )}
        </section>
      </main>

      <Link href="/app/wishlist" className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/35 md:bottom-6" aria-label="위시 추가">
        <Plus className="h-6 w-6" />
      </Link>

      {toast ? <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg">{toast}</div> : null}
    </div>
  );
}
