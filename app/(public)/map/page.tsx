export default function PublicMapPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-lg font-bold text-gray-900">
          가자고 <span className="text-[#D0704C]">📍</span>
        </a>
        <a href="/login" className="text-sm font-semibold text-[#D0704C]">
          로그인
        </a>
      </header>
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-4 text-5xl">🗺️</p>
          <p className="mb-2 text-lg font-semibold text-gray-700">공유 지도 둘러보기</p>
          <p className="mb-8 text-sm text-gray-400">커플과 친구들이 저장한 장소를 한눈에 살펴보세요.</p>
          <a
            href="/login"
            className="inline-block rounded-xl bg-[#D0704C] px-6 py-3 text-sm font-semibold text-white"
          >
            로그인하고 내 위시리스트 보기
          </a>
        </div>
      </div>
    </div>
  );
}
