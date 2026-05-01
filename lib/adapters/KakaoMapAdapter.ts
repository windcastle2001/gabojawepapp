import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

export class KakaoMapAdapter implements Adapter {
  readonly sourceType = 'kakao_map' as const;

  matches(url: string): boolean {
    return /kko\.to|place\.map\.kakao\.com|map\.kakao\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    const resolved = await this.resolveRedirect(url);
    const res = await fetch(resolved, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`카카오맵 fetch 실패: ${res.status}`);
    return res.text();
  }

  private async resolveRedirect(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });
      return res.headers.get('location') ?? url;
    } catch {
      return url;
    }
  }
}
