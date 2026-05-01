'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommunityPlace } from './types';

declare global {
  interface Window {
    kakao?: {
      maps: {
        LatLng: new (lat: number, lng: number) => unknown;
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
        MarkerImage: new (src: string, size: unknown, options?: { offset?: unknown }) => unknown;
        Marker: new (options: { map: unknown; position: unknown; title?: string; image?: unknown }) => {
          setMap: (map: unknown | null) => void;
        };
        InfoWindow: new (options: { content: string; removable?: boolean }) => {
          open: (map: unknown, marker: unknown) => void;
          close: () => void;
        };
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          setCenter: (latLng: unknown) => void;
          setLevel: (level: number) => void;
        };
        event: {
          addListener: (target: unknown, eventName: string, handler: () => void) => void;
        };
        load: (callback: () => void) => void;
      };
    };
  }
}

interface KakaoMapProps {
  appKey: string;
  places: CommunityPlace[];
  onPlaceSelect: (place: CommunityPlace) => void;
  selectedId: number | null;
}

const CATEGORY_MARKERS: Record<string, string> = {
  카페: 'D0704C',
  맛집: 'E27D60',
  산책: '6FA48B',
  액티비티: '5B8DEF',
};

function makeMarkerSvg(hexColor: string) {
  const color = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
  const svg = `
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 46C20 46 34 31.4 34 19.5C34 11.49 27.73 5 20 5C12.27 5 6 11.49 6 19.5C6 31.4 20 46 20 46Z" fill="${color}" />
      <circle cx="20" cy="19" r="7" fill="white" fill-opacity="0.92" />
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function ensureKakaoMapScript(appKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is unavailable.'));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]');
    if (existing) {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => resolve());
        return;
      }
      existing.remove();
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMapSdk = 'true';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK did not initialize.'));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK.'));
    document.head.appendChild(script);
  });
}

export function KakaoMap({ appKey, places, onPlaceSelect, selectedId }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<NonNullable<typeof window.kakao>['maps']['Map']> | null>(null);
  const markersRef = useRef<Array<{ setMap: (map: unknown | null) => void }>>([]);
  const infoWindowRef = useRef<{ close: () => void } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const selectedPlace = useMemo(
    () => (selectedId ? places.find((place) => place.id === selectedId) ?? null : null),
    [places, selectedId]
  );

  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    if (!containerRef.current) return;

    let disposed = false;

    ensureKakaoMapScript(appKey)
      .then(() => {
        if (disposed || !containerRef.current || !window.kakao?.maps) return;

        const { maps } = window.kakao;
        const center = new maps.LatLng(37.5665, 126.978);
        const map = new maps.Map(containerRef.current, { center, level: 6 });
        mapRef.current = map;
        setLoadError(null);
      })
      .catch((error: Error) => {
        if (!disposed) {
          setLoadError(error.message);
        }
      });

    return () => {
      disposed = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, [appKey]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const { maps } = window.kakao;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
    infoWindowRef.current = null;

    places.forEach((place) => {
      const imageSrc = makeMarkerSvg(CATEGORY_MARKERS[place.category] ?? '7B6F68');
      const imageSize = new maps.Size(40, 48);
      const imageOption = { offset: new maps.Point(20, 44) };
      const markerImage = new maps.MarkerImage(imageSrc, imageSize, imageOption);
      const marker = new maps.Marker({
        map: mapRef.current,
        position: new maps.LatLng(place.lat, place.lng),
        title: place.title,
        image: markerImage,
      });

      const infoWindow = new maps.InfoWindow({
        removable: false,
        content: `
          <div style="padding:10px 12px;min-width:180px;">
            <div style="font-weight:700;font-size:13px;color:#2A2A2A;">${place.title}</div>
            <div style="margin-top:4px;font-size:12px;color:#6B6B6B;">${place.category} · 평점 ${place.rating}</div>
          </div>
        `,
      });

      maps.event.addListener(marker, 'click', () => {
        infoWindowRef.current?.close();
        infoWindow.open(mapRef.current!, marker);
        infoWindowRef.current = infoWindow;
        onPlaceSelect(place);
      });

      markersRef.current.push(marker);
    });
  }, [onPlaceSelect, places]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps || !selectedPlace) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(selectedPlace.lat, selectedPlace.lng));
    mapRef.current.setLevel(4);
  }, [selectedPlace]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--muted))] px-6 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">카카오맵을 불러오지 못했습니다.</p>
          <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
          <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            <p>현재 접속 주소: {currentOrigin || '확인 중'}</p>
            <p>가장 흔한 원인은 JavaScript 키 대신 다른 키를 넣었거나,</p>
            <p>카카오 Developers에 이 주소를 JavaScript SDK 도메인으로 등록하지 않은 경우입니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" aria-label="카카오 커뮤니티 지도" />;
}
