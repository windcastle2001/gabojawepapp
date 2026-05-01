import type { Adapter } from './types';
import { KakaoMapAdapter } from './KakaoMapAdapter';
import { NaverMapAdapter } from './NaverMapAdapter';
import { GoogleMapAdapter } from './GoogleMapAdapter';
import { NaverBlogAdapter } from './NaverBlogAdapter';
import { YouTubeAdapter } from './YouTubeAdapter';
import { InstagramAdapter } from './InstagramAdapter';
import { GenericAdapter } from './GenericAdapter';

// 우선순위 순으로 등록. 먼저 등록된 어댑터가 매칭 우선권을 가진다.
const adapters: Adapter[] = [
  new KakaoMapAdapter(),
  new NaverMapAdapter(),
  new GoogleMapAdapter(),
  new NaverBlogAdapter(),
  new YouTubeAdapter(),
  new InstagramAdapter(),
];

/**
 * URL에 매칭되는 어댑터를 반환한다.
 * 매칭 어댑터가 없으면 GenericAdapter를 반환한다.
 */
export function selectAdapter(url: string): Adapter {
  return adapters.find((a) => a.matches(url)) ?? new GenericAdapter();
}
