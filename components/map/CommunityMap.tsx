'use client';

import { useEffect, useState } from 'react';
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
  const [preferKakao, setPreferKakao] = useState(Boolean(kakaoAppKey));

  useEffect(() => {
    setPreferKakao(Boolean(kakaoAppKey));
  }, [kakaoAppKey]);

  if (kakaoAppKey && preferKakao) {
    return (
      <KakaoMap
        appKey={kakaoAppKey}
        places={places}
        onPlaceSelect={onPlaceSelect}
        selectedId={selectedId}
        onLoadError={() => setPreferKakao(false)}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <LeafletMap places={places} onPlaceSelect={onPlaceSelect} selectedId={selectedId} />
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-border/80 bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[11px] font-semibold text-foreground">
          {kakaoAppKey ? '카카오맵 연결 전까지 대체 지도를 보여주는 중' : '대체 지도를 보여주는 중'}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {kakaoAppKey
            ? '카카오 설정이 완료되면 실제 카카오 지도 화면으로 전환할 수 있어요.'
            : '`.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_KEY`를 넣으면 카카오 지도도 연결할 수 있어요.'}
        </p>
      </div>
    </div>
  );
}
