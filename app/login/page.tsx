'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { createPrototypeSession, saveSession, type AuthMode, type GroupType } from '@/lib/prototype-store';
import { createClient } from '@/lib/supabase/client';
import type { GroupSnapshot } from '@/lib/groups';
import { cn } from '@/lib/utils';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
    </svg>
  );
}

const FEATURES = [
  {
    title: '로그인 없이 둘러보기',
    desc: '커뮤니티 지도와 샘플 위시리스트를 먼저 확인할 수 있어요.',
    tone: 'muted',
  },
  {
    title: 'Google로 내 공간 만들기',
    desc: '초대, 공유, 리뷰, AI 추천까지 실제 흐름으로 이어집니다.',
    tone: 'brand',
  },
  {
    title: '커플 또는 친구 모드 선택',
    desc: '커플은 2명, 친구 모드는 최대 10명까지 함께 쓸 수 있어요.',
    tone: 'secondary',
  },
] as const;

function ModeCard({
  type,
  selected,
  onClick,
}: {
  type: GroupType;
  selected: boolean;
  onClick: () => void;
}) {
  const isCouple = type === 'couple';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border p-5 text-left transition-all active:scale-[0.99]',
        selected
          ? isCouple
            ? 'border-brand bg-brand/10 shadow-sm'
            : 'border-secondary bg-secondary/10 shadow-sm'
          : 'border-border bg-card hover:border-brand/40'
      )}
      aria-pressed={selected}
    >
      <div className="flex gap-4">
        <span className="text-4xl leading-none" aria-hidden>
          {isCouple ? '♡' : '👥'}
        </span>
        <div>
          <p className={cn('text-base font-bold', isCouple ? 'text-brand' : 'text-secondary')}>
            {isCouple ? '커플로 사용' : '친구들과 사용'}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {isCouple ? '파트너 1명 초대' : '최대 10명까지 초대'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {isCouple
              ? '둘만의 위시리스트와 커플 리뷰를 쌓는 흐름으로 시작합니다.'
              : '친구들과 장소를 모으고 함께 다녀온 후 친구 리뷰로 공유할 수 있어요.'}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [groupType, setGroupType] = useState<GroupType>('couple');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'google') {
      setAuthMode('google');
    }
    if (params.get('error')) {
      setAuthError('Google 로그인 처리 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.');
    }
  }, []);

  async function enterApp(mode: AuthMode, type: GroupType) {
    setIsEntering(true);
    setAuthError(null);

    try {
      const session = createPrototypeSession(mode, type);

      if (mode === 'google') {
        const response = await fetch('/api/groups/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupType: type }),
        });
        const data = (await response.json()) as { group?: GroupSnapshot; error?: string };

        if (!response.ok || !data.group) {
          throw new Error(data.error ?? '초대 공간을 만들지 못했습니다.');
        }

        saveSession({
          ...session,
          inviteCode: data.group.inviteCode,
          inviteUrl: data.group.inviteUrl,
          remoteGroupId: data.group.id,
          partnerAccepted: data.group.groupType === 'couple' ? data.group.memberCount >= 2 : false,
          friendMembers: data.group.groupType === 'friends' ? data.group.memberCount : 1,
          connectedAt: data.group.memberCount >= 2 ? new Date().toISOString().split('T')[0] : null,
        });
      } else {
        saveSession(session);
      }

      router.push('/app');
    } catch (error) {
      console.error(error);
      setAuthError(error instanceof Error ? error.message : '공간 생성 중 문제가 생겼어요.');
    } finally {
      setIsEntering(false);
    }
  }

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/login?auth=google`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error(error);
      setAuthError('Google 로그인 연결에 실패했어요. Supabase Google Provider 설정과 Vercel 환경변수를 확인해 주세요.');
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 pb-8 pt-14">
        <div className="rounded-[2rem] bg-gradient-to-br from-brand/15 via-card to-secondary/10 px-6 py-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-card text-5xl shadow-sm" aria-hidden>
            📍
          </div>
          <h1 className="text-display text-foreground">가자고</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            장소를 빠르게 저장하고, 커플이나 친구들과 다음 약속을 함께 정해보세요.
          </p>
        </div>

        {!authMode ? (
          <>
            <div className="mt-6 space-y-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="flex items-center gap-4 px-4 py-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl',
                      feature.tone === 'brand'
                        ? 'bg-brand/10'
                        : feature.tone === 'secondary'
                          ? 'bg-secondary/10'
                          : 'bg-muted'
                    )}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-auto space-y-3 pt-8">
              <Button onClick={signInWithGoogle} disabled={isGoogleLoading} className="w-full" aria-label="Google로 시작하기">
                <GoogleIcon />
                {isGoogleLoading ? 'Google로 이동 중...' : 'Google로 시작하기'}
              </Button>
              <Button variant="outline" onClick={() => setAuthMode('guest')} className="w-full" aria-label="로그인 없이 둘러보기">
                로그인 없이 둘러보기
              </Button>
              {authError && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-medium text-destructive">
                  {authError}
                </p>
              )}
              <p className="text-center text-xs text-muted-foreground">
                둘러보기 모드에서는 커뮤니티 지도 확인이 가능하고, 초대와 AI 추천은 로그인 후 사용할 수 있어요.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-6 flex flex-1 flex-col">
            <div className="mb-4">
              <p className="text-heading text-foreground">어떻게 시작할까요?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {authMode === 'guest'
                  ? '먼저 둘러보는 흐름이라도 커플용인지 친구용인지 골라둘게요.'
                  : '로그인 후 선택한 모드에 맞춰 초대와 공유 흐름이 달라집니다.'}
              </p>
            </div>

            <div className="space-y-3">
              <ModeCard type="couple" selected={groupType === 'couple'} onClick={() => setGroupType('couple')} />
              <ModeCard type="friends" selected={groupType === 'friends'} onClick={() => setGroupType('friends')} />
            </div>

            <div className="mt-auto grid grid-cols-[auto,1fr] gap-3 pt-8">
              <Button variant="ghost" onClick={() => setAuthMode(null)} aria-label="이전 화면으로 돌아가기">
                ←
              </Button>
              <Button
                onClick={() => enterApp(authMode, groupType)}
                variant={groupType === 'friends' ? 'secondary' : 'default'}
                disabled={isEntering}
                isLoading={isEntering}
              >
                {groupType === 'couple' ? '커플 공간 시작하기' : '친구 모임 시작하기'}
              </Button>
            </div>
            {authError && (
              <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-center text-xs font-medium text-destructive">
                {authError}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
