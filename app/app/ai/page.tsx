'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { getCommunityPlaces, getSession, getWishlist, type PrototypeSession } from '@/lib/prototype-store';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  source?: 'gemini' | 'fallback';
}

const QUICK_QUESTIONS = [
  '오늘 5만원 안쪽으로 갈 만한 코스 짜줘',
  '이번 주말 비 와도 괜찮은 코스 추천해줘',
  '위시리스트에서 동선 좋은 순서로 묶어줘',
];

function AILockedScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-5 pb-4 pt-12">
        <h1 className="text-xl font-black text-foreground">AI 추천</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-4xl" aria-hidden>
          🤖
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">Google 로그인이 필요해요</h2>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          AI 추천은 내 위시리스트와 모임 정보를 바탕으로 코스를 짜기 때문에 로그인 후 사용할 수 있어요.
        </p>

        <Card className="mb-8 w-full max-w-sm space-y-3 p-4 text-left">
          {[
            ['링크 자동 분석', '카카오맵/네이버지도 링크에서 장소 정보를 정리'],
            ['맞춤 코스 추천', '위시리스트와 커뮤니티 리뷰를 같이 참고'],
            ['예산 힌트', '예산과 분위기에 맞는 순서 제안'],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </Card>

        <Link
          href="/login"
          className="inline-flex h-11 w-full max-w-sm items-center justify-center rounded-2xl bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
        >
          Google로 로그인하기
        </Link>
      </div>
    </div>
  );
}

export default function AIPage() {
  const [session, setSession] = useState<PrototypeSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = getSession();
    setSession(current);
    setMessages([
      {
        id: 1,
        role: 'ai',
        text:
          current.groupType === 'friends'
            ? '친구 모임 기준으로 저장된 장소를 묶어서 코스를 짜드릴게요. 날짜, 예산, 지역을 알려주세요.'
            : '둘이 가기 좋은 코스를 위시리스트와 커뮤니티 리뷰를 참고해서 짜드릴게요. 원하는 분위기를 알려주세요.',
      },
    ]);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || isTyping || !session) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: message }]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          groupType: session.groupType,
          wishlist: getWishlist().map((item) => ({
            title: item.title,
            category: item.category,
            address: item.address,
            tags: item.tags,
            completed: item.completed,
          })),
          communityPlaces: getCommunityPlaces().map((place) => ({
            title: place.title,
            category: place.category,
            address: place.address,
            rating: place.rating,
            reviewCount: place.reviewCount,
          })),
        }),
      });

      const data = (await response.json()) as { plan?: string; source?: 'gemini' | 'fallback' };
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: data.plan ?? '추천을 만들지 못했어요. 지역이나 예산을 조금 더 구체적으로 알려주세요.',
          source: data.source,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: 'AI 연결이 잠시 불안정해요. 그래도 위시리스트 기준으로 다시 시도해볼 수 있어요.',
          source: 'fallback',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin-custom rounded-full border-4 border-brand/20 border-t-brand" aria-label="로딩 중" />
      </div>
    );
  }

  if (session.authMode === 'guest') {
    return <AILockedScreen />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-5 pb-4 pt-12 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">AI 추천</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {session.groupType === 'friends' ? '친구 모임 코스 플래너' : '커플 데이트 코스 플래너'}
            </p>
          </div>
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            Gemini 연결
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto border-b border-border bg-card px-5 py-3">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => sendMessage(question)}
            disabled={isTyping}
            className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <div ref={listRef} className="mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                message.role === 'user'
                  ? 'bg-brand text-brand-foreground'
                  : 'border border-border bg-card text-foreground'
              )}
            >
              {message.text}
              {message.source === 'fallback' && (
                <p className="mt-2 text-[11px] text-muted-foreground">현재는 안전 응답으로 표시됐어요.</p>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex gap-1" aria-label="AI가 답변 작성 중">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-2 w-2 animate-bounce-dot rounded-full bg-brand"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl border-t border-border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage(inputText);
              }
            }}
            placeholder="예산, 지역, 분위기를 알려주세요"
            className="min-w-0 flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
            disabled={isTyping}
          />
          <Button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isTyping} aria-label="메시지 전송">
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
