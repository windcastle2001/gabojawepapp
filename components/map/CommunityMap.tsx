'use client';

import { KakaoMap } from './KakaoMap';
import { LeafletMap } from './LeafletMap';
import type { CommunityPlace } from './types';

interface CommunityMapProps {
  places: CommunityPlace[];
  onPlaceSelect: (place: CommunityPlace) => void;
  selectedId: number | null;
}

export function CommunityMap({ places, onPlaceSelect, selectedId }: CommunityMapProps) {
  const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();

  if (kakaoAppKey) {
    return (
      <KakaoMap
        appKey={kakaoAppKey}
        places={places}
        onPlaceSelect={onPlaceSelect}
        selectedId={selectedId}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <LeafletMap places={places} onPlaceSelect={onPlaceSelect} selectedId={selectedId} />
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-border/80 bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[11px] font-semibold text-foreground">카카오맵 연결 대기 중</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          `.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_KEY`를 넣으면 실제 카카오 지도로 전환됩니다.
        </p>
      </div>
    </div>
  );
}
