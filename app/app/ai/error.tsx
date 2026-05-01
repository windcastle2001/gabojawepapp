'use client';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AiError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[AiError]', error.message, error.digest);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div className="w-12 h-12 mb-4 rounded-2xl bg-[#FFE4EF] flex items-center justify-center text-2xl" aria-hidden>
        😢
      </div>
      <h2 className="text-lg font-bold text-[#2A2A2A] mb-2">AI 추천을 불러오지 못했어요</h2>
      <p className="text-sm text-[#888] mb-6">잠시 후 다시 시도해주세요.</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#FF6B9D] text-white text-sm font-semibold rounded-2xl active:scale-95 transition-transform shadow-md shadow-[#FF6B9D]/30"
        aria-label="AI 추천 다시 시도"
      >
        다시 시도
      </button>
    </div>
  );
}
