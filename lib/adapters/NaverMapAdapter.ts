import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

export class NaverMapAdapter implements Adapter {
  readonly sourceType = 'naver_map' as const;

  matches(url: string): boolean {
    return /naver\.me|map\.naver\.com|m\.place\.naver\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    // 단축 URL 또는 앱 링크는 리다이렉트 추적 후 실제 페이지 요청
    const resolved = await this.resolveRedirect(url);
    const res = await fetch(resolved, {
      headers: {
        'User-Agent': USER_AGENT,
        // 네이버 지도는 Referer 헤더가 있어야 일부 리소스 반환
        Referer: 'https://map.naver.com/',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`네이버지도 fetch 실패: ${res.status}`);
    return res.text();
  }

  private async resolveRedirect(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });
      const location = res.headers.get('location');
      // 재귀 리다이렉트 1회 추가 추적
      if (location && location !== url) {
        const res2 = await fetch(location, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        });
        return res2.headers.get('location') ?? location;
      }
      return location ?? url;
    } catch {
      return url;
    }
  }
}
