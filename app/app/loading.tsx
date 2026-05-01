// app/app/loading.tsx — 메인 앱 영역 전역 로딩 스켈레톤
export default function AppLoading() {
  return (
    <div
      className="min-h-screen dark:bg-gray-950"
      role="status"
      aria-live="polite"
      aria-label="콘텐츠를 불러오는 중입니다"
      aria-busy="true"
    >
      {/* 헤더 스켈레톤 */}
      <div className="bg-white dark:bg-gray-900 px-4 pt-12 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-3 w-36 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* CaptureInput 스켈레톤 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* 카드 스켈레톤 3개 */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-44 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
