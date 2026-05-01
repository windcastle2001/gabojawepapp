// app/app/map/loading.tsx — 지도 페이지 스켈레톤
export default function MapLoading() {
  return (
    <div aria-label="지도 로딩 중" aria-busy="true">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="h-5 w-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="h-[calc(100vh-12rem)] bg-gray-100 animate-pulse" />
    </div>
  );
}
