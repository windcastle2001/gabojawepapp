import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';
import { safeFetch, safeResolveRedirectUrl } from './safe-fetch';

export class NaverMapAdapter implements Adapter {
  readonly sourceType = 'naver_map' as const;

  matches(url: string): boolean {
    return /naver\.me|map\.naver\.com|m\.place\.naver\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    const resolved = await this.resolveRedirect(url);
    const res = await safeFetch(resolved, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: 'https://map.naver.com/',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Naver map fetch failed: ${res.status}`);
    return res.text();
  }

  private async resolveRedirect(url: string): Promise<string> {
    try {
      return await safeResolveRedirectUrl(url, 2);
    } catch {
      return url;
    }
  }
}
