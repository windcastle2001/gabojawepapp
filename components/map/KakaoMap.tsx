'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommunityPlace } from './types';

interface KakaoMapProps {
  appKey: string;
  places: CommunityPlace[];
  onPlaceSelect: (place: CommunityPlace) => void;
  selectedId: number | string | null;
  userLocation?: { lat: number; lng: number } | null;
  onLoadError?: (message: string) => void;
}

const CATEGORY_MARKERS: Record<string, string> = {
  카페: 'D0704C',
  맛집: 'E27D60',
  산책: '6FA48B',
  액티비티: '5B8DEF',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });
}

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
      reject(new Error('브라우저 환경에서만 지도를 불러올 수 있습니다.'));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]');
    if (existing) {
      existing.addEventListener('load', () => window.kakao?.maps?.load(() => resolve()), { once: true });
      existing.addEventListener('error', () => reject(new Error('Kakao Maps SDK 로드에 실패했습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMapSdk = 'true';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('Kakao Maps SDK가 초기화되지 않았습니다.'));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error('Kakao Maps SDK 로드에 실패했습니다.'));
    document.head.appendChild(script);
  });
}

async function getKakaoStatusMessage() {
  try {
    const response = await fetch('/api/kakao-map-status', { cache: 'no-store' });
    const data = (await response.json()) as { ok?: boolean; reason?: string; message?: string };
    if (data.ok) return null;
    if (data.reason === 'missing_key') return 'NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다.';
    if (data.reason === 'NotAuthorizedError') {
      return '카카오 Developers의 JavaScript SDK 도메인에 현재 접속 주소가 등록되어 있는지 확인해 주세요.';
    }
    return data.message ?? null;
  } catch {
    return null;
  }
}

export function KakaoMap({ appKey, places, onPlaceSelect, selectedId, userLocation, onLoadError }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<NonNullable<typeof window.kakao>['maps']['Map']> | null>(null);
  const markersRef = useRef<Array<{ setMap: (map: unknown | null) => void }>>([]);
  const infoWindowRef = useRef<{ close: () => void } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(null);
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
        const firstPlace = places[0];
        const center = userLocation
          ? new maps.LatLng(userLocation.lat, userLocation.lng)
          : firstPlace
            ? new maps.LatLng(firstPlace.lat, firstPlace.lng)
            : new maps.LatLng(37.5665, 126.978);
        const map = new maps.Map(containerRef.current, { center, level: userLocation ? 4 : firstPlace ? 5 : 7 });
        mapRef.current = map;
        setLoadError(null);
        setDiagnosticMessage(null);
      })
      .catch(async (error: Error) => {
        if (!disposed) {
          const diagnostic = await getKakaoStatusMessage();
          setLoadError(error.message);
          setDiagnosticMessage(diagnostic);
          onLoadError?.(diagnostic ?? error.message);
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
  }, [appKey, onLoadError, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const { maps } = window.kakao;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    infoWindowRef.current?.close();
    infoWindowRef.current = null;

    const bounds = new maps.LatLngBounds();
    places.forEach((place) => {
      const markerPosition = new maps.LatLng(place.lat, place.lng);
      bounds.extend(markerPosition);
      const imageSrc = makeMarkerSvg(CATEGORY_MARKERS[place.category] ?? '7B6F68');
      const markerImage = new maps.MarkerImage(imageSrc, new maps.Size(40, 48), { offset: new maps.Point(20, 44) });
      const marker = new maps.Marker({
        map: mapRef.current,
        position: markerPosition,
        title: place.title,
        image: markerImage,
      });

      const infoWindow = new maps.InfoWindow({
        removable: false,
        content: `
          <div style="padding:10px 12px;min-width:180px;">
            <div style="font-weight:700;font-size:13px;color:#2B2521;">${escapeHtml(place.title)}</div>
            <div style="margin-top:4px;font-size:12px;color:#7B6F68;">${escapeHtml(place.category)} · 평점 ${place.rating}</div>
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

    if (userLocation) {
      mapRef.current.setCenter(new maps.LatLng(userLocation.lat, userLocation.lng));
      mapRef.current.setLevel(4);
    } else if (places.length > 1) {
      mapRef.current.setBounds(bounds);
    } else if (places[0]) {
      mapRef.current.setCenter(new maps.LatLng(places[0].lat, places[0].lng));
      mapRef.current.setLevel(5);
    }
  }, [onPlaceSelect, places, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps || !userLocation) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng));
    mapRef.current.setLevel(4);
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps || !selectedPlace) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(selectedPlace.lat, selectedPlace.lng));
    mapRef.current.setLevel(4);
  }, [selectedPlace]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--muted))] px-6 text-center">
        <div className="max-w-md rounded-3xl bg-background/95 p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">카카오맵을 불러오지 못했습니다.</p>
          <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
          {diagnosticMessage ? <p className="mt-2 text-xs font-medium text-foreground">{diagnosticMessage}</p> : null}
          <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            <p>현재 접속 주소: {currentOrigin || '확인 중'}</p>
            <p>로컬은 `http://localhost:3002`, `http://127.0.0.1:3002`를 등록하고, Vercel 주소도 별도로 등록해야 합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" aria-label="카카오 커뮤니티 지도" />;
}
