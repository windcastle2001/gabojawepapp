export {};

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
        services?: {
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
          Places: new () => {
            keywordSearch: (
              query: string,
              callback: (
                data: Array<{
                  id: string;
                  place_name: string;
                  category_name: string;
                  address_name: string;
                  road_address_name: string;
                  x: string;
                  y: string;
                  place_url: string;
                }>,
                status: string
              ) => void
            ) => void;
          };
        };
      };
    };
  }
}
