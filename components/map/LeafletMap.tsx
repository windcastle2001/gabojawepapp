'use client';

import { useEffect, useRef } from 'react';
import type { CommunityPlace } from './types';

const CATEGORY_COLORS: Record<string, string> = {
  카페: '#D0704C',
  맛집: '#E27D60',
  산책: '#6FA48B',
  액티비티: '#5B8DEF',
};

const CATEGORY_EMOJI: Record<string, string> = {
  카페: '☕',
  맛집: '🍽',
  산책: '🌿',
  액티비티: '🎟',
};

interface LeafletMapProps {
  places: CommunityPlace[];
  onPlaceSelect: (place: CommunityPlace) => void;
  selectedId: number | null;
}

export function LeafletMap({ places, onPlaceSelect, selectedId }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [37.5665, 126.978],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      markersRef.current.forEach((marker) => {
        (marker as { remove: () => void }).remove();
      });
      markersRef.current = [];

      places.forEach((place) => {
        const color = CATEGORY_COLORS[place.category] ?? '#7B6F68';
        const emoji = CATEGORY_EMOJI[place.category] ?? '📍';
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 999px;
              background: ${color};
              border: 3px solid white;
              box-shadow: 0 4px 16px rgba(42, 42, 42, 0.24);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              cursor: pointer;
            ">
              ${emoji}
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([place.lat, place.lng], { icon }).addTo(mapRef.current as L.Map);
        marker.on('click', () => onPlaceSelect(place));
        markersRef.current.push(marker);
      });
    });
  }, [onPlaceSelect, places]);

  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const place = places.find((item) => item.id === selectedId);
    if (!place) return;

    (mapRef.current as { setView: (latLng: [number, number], zoom: number, options?: { animate?: boolean }) => void }).setView(
      [place.lat, place.lng],
      15,
      { animate: true }
    );
  }, [places, selectedId]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        // @ts-ignore
        crossOrigin=""
      />
      <div ref={containerRef} className="h-full w-full" aria-label="커뮤니티 지도" />
    </>
  );
}
