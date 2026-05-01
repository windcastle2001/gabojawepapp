'use client';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WishlistError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[WishlistError]', error.message, error.digest);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div className="w-12 h-12 mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center" aria-hidden>
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">위시리스트를 불러오지 못했어요</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">잠시 후 다시 시도해주세요.</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-brand text-white text-sm font-semibold rounded-2xl active:scale-95 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label="위시리스트 다시 불러오기"
      >
        다시 시도
      </button>
    </div>
  );
}
