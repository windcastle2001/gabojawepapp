import { GenericAdapter } from './GenericAdapter';
import { GoogleMapAdapter } from './GoogleMapAdapter';
import { InstagramAdapter } from './InstagramAdapter';
import { KakaoMapAdapter } from './KakaoMapAdapter';
import { NaverBlogAdapter } from './NaverBlogAdapter';
import { NaverMapAdapter } from './NaverMapAdapter';
import { YouTubeAdapter } from './YouTubeAdapter';
import type { Adapter } from './types';

const adapters: Adapter[] = [
  new KakaoMapAdapter(),
  new NaverMapAdapter(),
  new GoogleMapAdapter(),
  new NaverBlogAdapter(),
  new YouTubeAdapter(),
  new InstagramAdapter(),
];

export function selectAdapter(url: string): Adapter {
  return adapters.find((adapter) => adapter.matches(url)) ?? new GenericAdapter();
}
