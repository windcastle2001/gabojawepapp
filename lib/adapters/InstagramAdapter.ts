import type { Adapter } from './types';
import { safeFetch } from './safe-fetch';

export class InstagramAdapter implements Adapter {
  readonly sourceType = 'instagram' as const;

  matches(url: string): boolean {
    return /instagram\.com\/(p|reel)\//.test(url);
  }

  async fetch(url: string): Promise<string> {
    const res = await safeFetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Instagram fetch failed: ${res.status}`);
    const html = await res.text();
    const ogBlock = this.extractOgBlock(html);
    return `[SOURCE_URL]: ${url}\n[NOTE]: Instagram OG-only. User input may be needed for full details.\n\n${ogBlock}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }
}
