'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCommunityPlaces, getSession, getWishlist, saveSession, type PrototypeSession } from '@/lib/prototype-store';
import { getRemoteAppSummary } from '@/lib/remote-store';

const TABS = [
  { id: 'home', emoji: '🏠', label: '홈', href: '/app' },
  { id: 'wishlist', emoji: '📌', label: '위시', href: '/app/wishlist' },
  { id: 'community', emoji: '🗺️', label: '커뮤니티', href: '/app/map' },
  { id: 'ai', emoji: '🤖', label: 'AI 추천', href: '/app/ai' },
  { id: 'memory', emoji: 'AI', label: 'AI 메모리', href: '/app/memory' },
];

function formatConnectedLabel(connectedAt: string | null) {
  if (!connectedAt) return '연결 전';
  const started = new Date(connectedAt);
  const diff = Math.floor((Date.now() - started.getTime()) / (1000 * 60 * 60 * 24));
  return `D+${Math.max(diff, 0)}`;
}

function BottomTabNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe md:hidden" aria-label="하단 내비게이션">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {TABS.map(({ id, emoji, label, href }) => {
          const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href);
          return (
            <Link key={id} href={href} className={cn('flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors', isActive ? 'text-brand' : 'text-muted-foreground')} aria-label={label} aria-current={isActive ? 'page' : undefined}>
              <span className={cn('text-xl leading-none transition-transform', isActive ? 'scale-110' : 'scale-100')} aria-hidden>{emoji}</span>
              <span className={cn('text-[10px] font-medium', isActive ? 'text-brand' : 'text-muted-foreground')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopSidebar({
  pathname,
  collapsed,
  onToggle,
  session,
  counts,
  onSessionChange,
}: {
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  session: PrototypeSession;
  counts: { wishlist: number; completed: number; community: number };
  onSessionChange: (session: PrototypeSession) => void;
}) {
  const isCouple = session.groupType !== 'friends';
  const isConnected = isCouple ? session.partnerAccepted : session.friendMembers > 1;
  const inviteUrl = session.inviteUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/join/${session.inviteCode}` : '');

  async function copyInvite() {
    await navigator.clipboard?.writeText(inviteUrl).catch(() => undefined);
  }

  function unlink() {
    const next = isCouple
      ? { ...session, partnerAccepted: false, connectedAt: null }
      : { ...session, friendMembers: 1, connectedAt: null };
    saveSession(next);
    onSessionChange(next);
  }

  const statusTitle = isCouple ? (isConnected ? '커플 연결 완료' : '커플 초대 대기') : `친구 모임 ${session.friendMembers}/10`;
  const statusLine = isConnected ? formatConnectedLabel(session.connectedAt) : `초대코드 ${session.inviteCode}`;

  return (
    <aside className={cn('fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-card transition-all duration-300 md:flex', collapsed ? 'w-16' : 'w-60')} aria-label="사이드바">
      <div className="flex items-center justify-between border-b border-border px-4 py-5">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-2xl leading-none" aria-hidden>📍</span>
            <span className="whitespace-nowrap text-base font-black text-brand">가자고</span>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand" aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}>
          <span className="text-lg leading-none" aria-hidden>{collapsed ? '→' : '←'}</span>
        </button>
      </div>

      {!collapsed && (
        <div className={cn('mx-3 mt-4 rounded-2xl p-3', isCouple ? 'bg-brand/10' : 'bg-secondary/10')}>
          <div className="text-xs">
            <p className="font-semibold text-foreground">{statusTitle}</p>
            <p className={cn('mt-0.5 font-bold', isCouple ? 'text-brand' : 'text-secondary')}>{statusLine}</p>
            {!isConnected ? <p className="mt-1 text-muted-foreground">초대 링크를 보내고 상대가 수락하면 같이 쓸 수 있어요.</p> : null}
          </div>
          {!isConnected ? (
            <button onClick={copyInvite} className={cn('mt-3 w-full rounded-xl py-2 text-xs font-semibold transition-colors', isCouple ? 'bg-brand text-brand-foreground hover:bg-brand/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90')}>
              초대 링크 복사
            </button>
          ) : (
            <button onClick={unlink} className="mt-3 w-full rounded-xl bg-card py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted">
              {isCouple ? '커플 연결 해제' : '모임 나가기'}
            </button>
          )}
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-1 px-2" aria-label="메인 메뉴">
        {TABS.map(({ id, emoji, label, href }) => {
          const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href);
          return (
            <Link key={id} href={href} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted hover:text-foreground')} aria-label={label} aria-current={isActive ? 'page' : undefined} title={collapsed ? label : undefined}>
              <span className="shrink-0 text-xl leading-none" aria-hidden>{emoji}</span>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="space-y-4 border-t border-border px-4 pb-6 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: '위시', value: String(counts.wishlist) },
              { label: '완료', value: String(counts.completed) },
              { label: '커뮤니티', value: String(counts.community) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-muted py-2">
                <p className="text-base font-bold text-brand">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<PrototypeSession>(getSession());
  const [counts, setCounts] = useState({ wishlist: 0, completed: 0, community: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('dm_sidebar_collapsed');
    if (saved === 'true') setCollapsed(true);

    const sync = () => {
      const nextSession = getSession();
      setSession(nextSession);
      if (nextSession.authMode === 'google') {
        getRemoteAppSummary()
          .then((summary) => setCounts(summary.counts))
          .catch(() => undefined);
        return;
      }
      const wishlist = getWishlist();
      const community = getCommunityPlaces();
      setCounts({
        wishlist: wishlist.filter((item) => !item.completed).length,
        completed: wishlist.filter((item) => item.completed).length,
        community: community.length,
      });
    };

    sync();
    window.addEventListener('dm-store-change', sync);
    return () => window.removeEventListener('dm-store-change', sync);
  }, []);

  useEffect(() => {
    if (!session.onboardingComplete || !session.groupType) {
      router.replace('/login');
    }
  }, [router, session.groupType, session.onboardingComplete]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dm_sidebar_collapsed', String(next));
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar pathname={pathname} collapsed={collapsed} onToggle={toggleSidebar} session={session} counts={counts} onSessionChange={setSession} />
      <main className={cn('min-h-screen pb-20 transition-all duration-300 md:pb-0', collapsed ? 'md:ml-16' : 'md:ml-60')}>
        <div className="mx-auto max-w-2xl animate-screen-in md:max-w-none">{children}</div>
      </main>
      <BottomTabNav pathname={pathname} />
    </div>
  );
}
