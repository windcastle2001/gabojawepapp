// app/app/ai/loading.tsx — AI 추천 페이지 스켈레톤
export default function AiLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI 추천을 불러오는 중입니다"
      aria-busy="true"
      className="dark:bg-gray-950"
    >
      <div className="bg-white dark:bg-gray-900 px-4 pt-12 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
      <div className="px-4 pt-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mx-auto" />
        <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mx-auto" />
        <div className="h-14 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse mt-8" />
      </div>
    </div>
  );
}
