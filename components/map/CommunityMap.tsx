'use client';

import { useEffect, useState } from 'react';
import { KakaoMap } from './KakaoMap';
import { LeafletMap } from './LeafletMap';
import type { CommunityPlace } from './types';

interface CommunityMapProps {
  places: CommunityPlace[];
  onPlaceSelect: (place: CommunityPlace) => void;
  selectedId: number | string | null;
  userLocation?: { lat: number; lng: number } | null;
}

function getKakaoAppKey() {
  return (
    process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim() ||
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() ||
    ''
  );
}

export function CommunityMap({ places, onPlaceSelect, selectedId, userLocation }: CommunityMapProps) {
  const kakaoAppKey = getKakaoAppKey();
  const [preferKakao, setPreferKakao] = useState(Boolean(kakaoAppKey));
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

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
        userLocation={userLocation}
        onLoadError={(message) => {
          setFallbackMessage(message);
          setPreferKakao(false);
        }}
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <LeafletMap places={places} onPlaceSelect={onPlaceSelect} selectedId={selectedId} userLocation={userLocation} />
      <div className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-2xl border border-border/80 bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[11px] font-semibold text-foreground">
          {kakaoAppKey ? '카카오맵 연결 전까지 대체 지도를 표시 중' : '대체 지도를 표시 중'}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {fallbackMessage ??
            (kakaoAppKey
              ? '카카오 Developers 도메인 설정 또는 JavaScript 키를 확인해 주세요.'
              : 'Vercel과 로컬 환경변수에 NEXT_PUBLIC_KAKAO_MAP_KEY를 넣으면 카카오맵으로 전환됩니다.')}
        </p>
      </div>
    </div>
  );
}
