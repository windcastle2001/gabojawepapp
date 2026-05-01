import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';
import { safeFetch, safeResolveRedirectUrl } from './safe-fetch';

export class KakaoMapAdapter implements Adapter {
  readonly sourceType = 'kakao_map' as const;

  matches(url: string): boolean {
    return /kko\.to|place\.map\.kakao\.com|map\.kakao\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    const resolved = await this.resolveRedirect(url);
    const res = await safeFetch(resolved, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Kakao map fetch failed: ${res.status}`);
    return res.text();
  }

  private async resolveRedirect(url: string): Promise<string> {
    try {
      return await safeResolveRedirectUrl(url, 1);
    } catch {
      return url;
    }
  }
}
