'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Link2, MapPin, Sparkles, Wand2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { getCommunityPlaces, getSession, getWishlist, type PrototypeSession } from '@/lib/prototype-store';
import { cn } from '@/lib/utils';

type Segment = 'plan' | 'wishlist' | 'extract';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  source?: 'gemini' | 'fallback';
  diagnostics?: string[];
}

type AiPlanResponse = {
  plan?: string;
  source?: 'gemini' | 'fallback';
  model?: string;
  diagnostics?: Array<{ level: 'info' | 'warning' | 'error'; message: string }>;
};

type CaptureResponse = {
  data?: {
    title: string;
    category: string;
    address?: string;
    summary?: string;
    tags?: string[];
    source_type?: string;
  };
  error?: string;
  code?: string;
};

const SEGMENTS: Array<{ id: Segment; label: string; icon: typeof Sparkles }> = [
  { id: 'plan', label: '코스 추천', icon: Sparkles },
  { id: 'wishlist', label: '위시 추천', icon: ClipboardList },
  { id: 'extract', label: '링크 정리', icon: Link2 },
];

const QUICK_PROMPTS: Record<Exclude<Segment, 'extract'>, string[]> = {
  plan: [
    '오늘 5만원 안쪽으로 이동 적은 코스 추천해줘',
    '비 오는 주말에 실내 중심으로 짜줘',
    '저녁 식사 전후로 3단계 코스 만들어줘',
  ],
  wishlist: [
    '위시리스트에서 지금 가장 먼저 갈 곳 골라줘',
    '카페와 식사를 엮어서 후보를 추천해줘',
    '완료하지 않은 장소만 기준으로 골라줘',
  ],
};

function AILockedScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-5 pb-4 pt-12">
        <h1 className="text-xl font-black text-foreground">AI 추천</h1>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-brand" aria-hidden>
          <Sparkles className="h-9 w-9" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-foreground">Google 로그인이 필요해요</h2>
        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
          AI 추천은 저장된 위시리스트와 모임 정보를 함께 쓰기 때문에 로그인 후 사용할 수 있어요.
        </p>

        <Card className="mb-8 w-full max-w-sm space-y-3 p-4 text-left">
          {[
            ['코스 추천', '위시리스트와 커뮤니티 장소를 묶어 실행 가능한 동선 제안'],
            ['위시 추천', '저장한 장소 중 지금 고르기 좋은 후보 정리'],
            ['링크 정리', '지도나 블로그 링크에서 장소 정보를 추출'],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </Card>

        <Link
          href="/login"
          className="inline-flex h-11 w-full max-w-sm items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
        >
          Google로 로그인하기
        </Link>
      </main>
    </div>
  );
}

function buildOpeningMessage(session: PrototypeSession) {
  const groupLabel = session.groupType === 'friends' ? '친구 모임' : '커플';
  return `${groupLabel} 기준으로 준비됐어요. 코스 추천, 위시 추천, 링크 정리 중 하나를 골라 바로 물어보세요.`;
}

function fallbackText(segment: Segment) {
  if (segment === 'extract') return 'https:// 로 시작하는 지도, 블로그, 영상 링크를 붙여넣어 주세요.';
  if (segment === 'wishlist') return '위시리스트에서 지금 갈 만한 후보를 추천해줘';
  return '오늘 바로 실행할 수 있는 코스를 추천해줘';
}

export default function AIPage() {
  const [session, setSession] = useState<PrototypeSession | null>(null);
  const [segment, setSegment] = useState<Segment>('plan');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = getSession();
    setSession(current);
    setMessages([{ id: 1, role: 'ai', text: buildOpeningMessage(current) }]);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const counts = useMemo(() => {
    const wishlist = getWishlist();
    return {
      wishlist: wishlist.filter((item) => !item.completed).length,
      community: getCommunityPlaces().length,
    };
  }, [session, messages.length]);

  async function runExtraction(rawUrl: string) {
    const url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: '링크 정리는 http:// 또는 https:// 로 시작하는 URL이 필요해요.', source: 'fallback' },
      ]);
      return;
    }

    const response = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = (await response.json()) as CaptureResponse;

    if (!response.ok || !data.data) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: data.error ?? '링크에서 장소 정보를 추출하지 못했어요. 다른 지도나 블로그 링크로 다시 시도해 보세요.',
          source: 'fallback',
          diagnostics: data.code ? [`capture code: ${data.code}`] : undefined,
        },
      ]);
      return;
    }

    const place = data.data;
    const lines = [
      `장소명: ${place.title}`,
      `분류: ${place.category}`,
      place.address ? `주소: ${place.address}` : '주소: 확인 필요',
      place.summary ? `요약: ${place.summary}` : null,
      place.tags?.length ? `태그: ${place.tags.join(', ')}` : null,
      place.source_type ? `출처 유형: ${place.source_type}` : null,
    ].filter(Boolean);

    setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'ai', text: lines.join('\n'), source: 'gemini' }]);
  }

  async function sendAiRequest(text: string, nextSegment = segment) {
    const message = text.trim() || fallbackText(nextSegment);
    if (isTyping || !session) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: message }]);
    setInputText('');
    setIsTyping(true);

    try {
      if (nextSegment === 'extract') {
        await runExtraction(message);
        return;
      }

      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: nextSegment,
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

      const data = (await response.json()) as AiPlanResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: data.plan ?? '추천을 만들지 못했어요. 지역, 예산, 분위기를 조금 더 구체적으로 알려주세요.',
          source: data.source,
          diagnostics: data.diagnostics?.map((item) => item.message),
        },
      ]);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: 'AI 요청 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.',
          source: 'fallback',
          diagnostics: [messageText],
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

  const activePrompts = segment === 'extract' ? [] : QUICK_PROMPTS[segment];

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-5 pb-4 pt-12 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">AI 추천</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Gemini 3 Flash Preview 기반 · 위시 {counts.wishlist}개 · 커뮤니티 {counts.community}개
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            Prototype
          </span>
        </div>
      </header>

      <div className="border-b border-border bg-card px-5 py-3">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2 rounded-xl bg-muted p-1">
          {SEGMENTS.map((item) => {
            const Icon = item.icon;
            const selected = segment === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSegment(item.id);
                  setInputText('');
                }}
                className={cn(
                  'flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors',
                  selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
                type="button"
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activePrompts.length > 0 && (
        <div className="mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto border-b border-border bg-card px-5 py-3">
          {activePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendAiRequest(prompt)}
              disabled={isTyping}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {segment === 'extract' && (
        <div className="border-b border-border bg-card px-5 py-3">
          <div className="mx-auto flex max-w-2xl items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-4 w-4 text-brand" aria-hidden />
            지도, 블로그, 영상 링크를 붙여넣으면 기존 캡처 파이프라인으로 장소 정보를 정리해요.
          </div>
        </div>
      )}

      <div ref={listRef} className="mx-auto w-full max-w-2xl flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                message.role === 'user' ? 'bg-brand text-brand-foreground' : 'border border-border bg-card text-foreground'
              )}
            >
              {message.text}
              {message.source === 'fallback' && <p className="mt-2 text-[11px] text-muted-foreground">안전한 대체 응답으로 표시됐어요.</p>}
              {message.diagnostics?.length ? (
                <details className="mt-2 text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer">진단 보기</summary>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {message.diagnostics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="AI가 답변 작성 중">
                <Wand2 className="h-4 w-4 animate-pulse text-brand" aria-hidden />
                생각 중...
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
                sendAiRequest(inputText);
              }
            }}
            placeholder={segment === 'extract' ? 'https:// 로 시작하는 링크를 붙여넣기' : '예산, 지역, 분위기를 알려주세요'}
            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
            disabled={isTyping}
          />
          <Button onClick={() => sendAiRequest(inputText)} disabled={isTyping || (!inputText.trim() && segment === 'extract')} aria-label="AI 요청 보내기">
            보내기
          </Button>
        </div>
      </div>
    </div>
  );
}
