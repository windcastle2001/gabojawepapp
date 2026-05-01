export interface NormalizedPayload {
  title: string;
  category: '음식' | '카페' | '장소' | '선물' | '여행' | '영상참고' | '기타';
  address?: string;
  lat?: number;
  lng?: number;
  summary?: string;
  tags?: string[];
  thumbnail_url?: string;
  source_url: string;
  source_type:
    | 'kakao_map'
    | 'naver_map'
    | 'google_map'
    | 'naver_blog'
    | 'youtube'
    | 'instagram'
    | 'manual';
}

export interface Adapter {
  readonly sourceType: NormalizedPayload['source_type'];
  matches(url: string): boolean;
  fetch(url: string): Promise<string>;
}

export interface AdapterResult {
  success: boolean;
  payload?: NormalizedPayload;
  error?: string;
  cached: boolean;
}
