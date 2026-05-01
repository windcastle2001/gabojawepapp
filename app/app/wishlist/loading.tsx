// app/app/wishlist/loading.tsx — 위시리스트 스켈레톤 UI
export default function WishlistLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="위시리스트를 불러오는 중입니다"
      aria-busy="true"
      className="dark:bg-gray-950"
    >
      {/* 헤더 스켈레톤 */}
      <div className="bg-white dark:bg-gray-900 px-4 pt-12 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse mb-3" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-14 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 카드 스켈레톤 */}
      <div className="px-4 py-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
              <div className="h-4 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
