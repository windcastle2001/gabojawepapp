'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ───── 타입 ───── */
interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

/* ───── 목업 AI 응답 ───── */
const MOCK_RESPONSES: Record<string, string> = {
  '오늘 뭐할까? 예산 5만원':
    '💕 오늘 5만원으로 즐기는 데이트 코스를 추천해드려요!\n\n📍 1. 오르에르 성수 (카페)\n   커피 2잔 ≈ 16,000원\n\n🍽️ 2. 성수동 골목 맛집\n   점심 2인 ≈ 20,000원\n\n🌸 3. 서울숲 산책\n   입장 무료!\n\n💰 총 예상 비용: 36,000~45,000원\n잔액으로 디저트도 가능해요 😊',
  '이번 주말 특별한 코스':
    '✨ 특별한 주말 데이트 코스예요!\n\n🌅 오전: 한강 피크닉\n   돗자리, 간식 준비해서 여유롭게\n\n☕ 오후: 연남동 카페 탐방\n   분위기 좋은 숨은 카페 발견!\n\n🍷 저녁: 청담 와인바 그라시\n   로맨틱한 저녁으로 마무리\n\n이 코스 어때요? 💑',
  '가성비 데이트':
    '🎯 가성비 최고 데이트 코스!\n\n📚 1. 국립중앙박물관 (무료)\n   2시간 알차게 관람\n\n🌿 2. 이태원 경리단길 산책 (무료)\n   예쁜 골목 사진 찍기\n\n🍜 3. 망원동 국수집\n   2인 12,000원으로 든든하게\n\n💚 총 비용: 1~2만원\n알뜰하게 즐기는 하루!',
};

const QUICK_QUESTIONS = [
  '오늘 뭐할까? 예산 5만원',
  '이번 주말 특별한 코스',
  '가성비 데이트',
];

/* ───── AI 잠금 화면 (데모 모드) ───── */
function AILockedScreen() {
  return (
    <div className="min-h-screen bg-[#FFF8FA] flex flex-col">
      <header className="bg-white px-5 pt-12 pb-4 border-b border-[#F0E8EC]">
        <h1 className="text-xl font-black text-[#2A2A2A]">AI 추천 ✨</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-[#FFE4EF] rounded-3xl flex items-center justify-center text-4xl mb-6 animate-float-bob">
          🔐
        </div>

        <h2 className="text-xl font-bold text-[#2A2A2A] mb-2">
          Google 로그인이 필요해요
        </h2>
        <p className="text-sm text-[#888] mb-8 leading-relaxed">
          AI 기능은 Google 계정으로 로그인해야<br />사용할 수 있어요
        </p>

        {/* AI 기능 목록 */}
        <div className="w-full max-w-sm space-y-3 mb-8">
          {[
            { emoji: '🔗', title: '링크 자동 분석', desc: '카톡·인스타 링크 1초 저장' },
            { emoji: '🗺️', title: '맞춤 코스 추천', desc: '위시리스트 기반 AI 데이트 코스' },
            { emoji: '💰', title: '예산 계산', desc: '예산에 맞는 최적 코스 제안' },
            { emoji: '🔄', title: 'AI 복구', desc: '삭제된 장소 자동 복구' },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 bg-white rounded-2xl border border-[#F0E8EC] px-4 py-3 shadow-sm text-left"
            >
              <span className="text-2xl shrink-0" aria-hidden>{emoji}</span>
              <div>
                <p className="text-sm font-semibold text-[#2A2A2A]">{title}</p>
                <p className="text-xs text-[#888]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="w-full max-w-sm block"
          aria-label="Google로 로그인하여 AI 기능 사용하기"
        >
          <button className="w-full py-4 bg-[#FF6B9D] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#FF6B9D]/30 active:scale-[0.98] transition-transform">
            Google로 로그인하기
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ───── AI 채팅 화면 ───── */
function AIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'ai',
      text: '안녕하세요! 💕 오늘 어떤 데이트를 원하세요?\n위시리스트를 분석해서 최적의 코스를 추천해드릴게요!',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const response =
        MOCK_RESPONSES[text.trim()] ??
        `"${text.trim()}"에 대한 맞춤 코스를 준비 중이에요! 😊\n위시리스트를 기반으로 최적의 데이트 코스를 분석하고 있어요.`;

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  }

  function handleShare() {
    const lastAI = [...messages].reverse().find((m) => m.role === 'ai');
    if (!lastAI) return;

    if (navigator.share) {
      navigator.share({
        title: '가자고 AI 코스 추천',
        text: lastAI.text,
      }).catch(() => {
        // 사용자 취소 — 무시
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(lastAI.text).catch(() => {
        // 클립보드 실패 — 무시
      });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#FFF8FA]">
      {/* 헤더 */}
      <header className="bg-white px-5 pt-12 pb-4 border-b border-[#F0E8EC] shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-xl font-black text-[#2A2A2A]">AI 추천 ✨</h1>
            <p className="text-xs text-[#888] mt-0.5">위시리스트 기반 맞춤 코스</p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5BB8F5] bg-[#E3F3FF] px-3 py-2 rounded-xl active:scale-95 transition-transform"
            aria-label="AI 추천 코스 카톡으로 공유하기"
          >
            <span aria-hidden>💬</span>
            카톡 공유
          </button>
        </div>
      </header>

      {/* 빠른 질문 */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-b border-[#F0E8EC] max-w-2xl mx-auto w-full">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={isTyping}
            className={cn(
              'shrink-0 text-xs px-3 py-2 rounded-full border font-medium transition-colors',
              isTyping
                ? 'bg-gray-50 text-[#BBB] border-gray-100 cursor-not-allowed'
                : 'bg-[#FFE4EF] text-[#FF6B9D] border-[#FFE4EF] hover:bg-[#FF6B9D] hover:text-white'
            )}
            aria-label={`빠른 질문: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* 채팅 메시지 영역 */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 max-w-2xl mx-auto w-full"
        aria-live="polite"
        aria-label="AI 채팅 메시지"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* 아바타 */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 self-end',
                msg.role === 'ai' ? 'bg-[#FFE4EF]' : 'bg-[#E3F3FF]'
              )}
              aria-hidden
            >
              {msg.role === 'ai' ? '🤖' : '🩷'}
            </div>

            {/* 말풍선 */}
            <div
              className={cn(
                'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'ai'
                  ? 'bg-white border border-[#F0E8EC] text-[#2A2A2A] rounded-tl-sm shadow-sm'
                  : 'bg-[#FF6B9D] text-white rounded-tr-sm'
              )}
            >
              {msg.text}
              <p
                className={cn(
                  'text-[10px] mt-1',
                  msg.role === 'ai' ? 'text-[#BBB]' : 'text-white/70'
                )}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {/* 타이핑 애니메이션 */}
        {isTyping && (
          <div className="flex gap-3 items-end" aria-label="AI가 입력 중">
            <div className="w-8 h-8 rounded-full bg-[#FFE4EF] flex items-center justify-center text-base shrink-0" aria-hidden>
              🤖
            </div>
            <div className="bg-white border border-[#F0E8EC] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#FF6B9D] animate-bounce-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="bg-white border-t border-[#F0E8EC] px-5 py-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예산, 날짜, 분위기를 알려주세요"
            className="flex-1 bg-[#FFF8FA] border border-[#F0E8EC] rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#FF6B9D] transition-colors text-[#2A2A2A] placeholder:text-[#BBB]"
            aria-label="AI에게 데이트 코스 질문하기"
            disabled={isTyping}
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center text-base transition-all shrink-0',
              !inputText.trim() || isTyping
                ? 'bg-gray-100 text-[#BBB] cursor-not-allowed'
                : 'bg-[#FF6B9D] text-white shadow-md shadow-[#FF6B9D]/30 active:scale-90'
            )}
            aria-label="메시지 전송"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── 메인 AI 페이지 ───── */
export default function AIPage() {
  const [isDemo, setIsDemo] = useState<boolean | null>(null);

  useEffect(() => {
    const mode = localStorage.getItem('dm_mode');
    setIsDemo(mode === 'demo');
  }, []);

  // 로딩 중
  if (isDemo === null) {
    return (
      <div className="min-h-screen bg-[#FFF8FA] flex items-center justify-center">
        <div className="text-4xl animate-float-bob" aria-hidden>✨</div>
      </div>
    );
  }

  return isDemo ? <AILockedScreen /> : <AIScreen />;
}
