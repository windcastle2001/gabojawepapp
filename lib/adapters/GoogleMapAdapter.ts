import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

export class GoogleMapAdapter implements Adapter {
  readonly sourceType = 'google_map' as const;

  matches(url: string): boolean {
    return /maps\.app\.goo\.gl|google\.com\/maps/.test(url);
  }

  async fetch(url: string): Promise<string> {
    // 구글맵 단축/공유 링크는 리다이렉트가 복수 단계일 수 있음
    const resolved = await this.resolveRedirect(url);
    const res = await fetch(resolved, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`구글지도 fetch 실패: ${res.status}`);
    const html = await res.text();

    // OG 메타 + 최종 URL을 함께 반환해 Gemini가 좌표 파싱에 활용하도록 함
    const ogBlock = this.extractOgBlock(html);
    return `[RESOLVED_URL]: ${resolved}\n\n${ogBlock}\n\n${html.slice(0, 4000)}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }

  private async resolveRedirect(url: string): Promise<string> {
    let current = url;
    // 구글맵 단축 링크는 최대 3회 리다이렉트
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(current, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000),
        });
        const location = res.headers.get('location');
        if (!location || location === current) break;
        current = location;
      } catch {
        break;
      }
    }
    return current;
  }
}
