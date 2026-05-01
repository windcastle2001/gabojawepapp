'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { createPrototypeSession, saveSession } from '@/lib/prototype-store';
import type { GroupSnapshot } from '@/lib/groups';

export default function JoinInvitePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const inviteCode = params.code?.toUpperCase();
  const [status, setStatus] = useState('초대 확인 중...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function join() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('Google 로그인으로 초대를 수락할 수 있어요.');
        return;
      }

      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      const data = (await response.json()) as { group?: GroupSnapshot; error?: string };

      if (!response.ok || !data.group) {
        setError(data.error ?? '초대 수락에 실패했습니다.');
        return;
      }

      const session = createPrototypeSession('google', data.group.groupType);
      saveSession({
        ...session,
        inviteCode: data.group.inviteCode,
        partnerAccepted: data.group.groupType === 'couple' ? data.group.memberCount >= 2 : false,
        friendMembers: data.group.groupType === 'friends' ? data.group.memberCount : 1,
        connectedAt: data.group.memberCount >= 2 ? new Date().toISOString().split('T')[0] : null,
      });
      router.replace('/app');
    }

    join().catch(() => setError('초대 처리 중 문제가 생겼습니다.'));
  }, [inviteCode, router]);

  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/join/${inviteCode}`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand/10 text-3xl" aria-hidden>
          📩
        </div>
        <h1 className="text-xl font-black text-foreground">가자고 초대</h1>
        <p className="mt-2 text-sm text-muted-foreground">초대 코드 {inviteCode}</p>
        <p className="mt-4 text-sm font-medium text-foreground">{error ?? status}</p>
        {!error && status.includes('로그인') ? (
          <Button onClick={signIn} className="mt-5 w-full">
            Google로 초대 수락
          </Button>
        ) : null}
        {error ? (
          <Button onClick={() => router.replace('/login')} className="mt-5 w-full">
            로그인 화면으로 이동
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
