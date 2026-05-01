import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';
import { safeFetch, safeResolveRedirectUrl } from './safe-fetch';

export class GoogleMapAdapter implements Adapter {
  readonly sourceType = 'google_map' as const;

  matches(url: string): boolean {
    return /maps\.app\.goo\.gl|google\.com\/maps/.test(url);
  }

  async fetch(url: string): Promise<string> {
    const resolved = await this.resolveRedirect(url);
    const res = await safeFetch(resolved, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Google map fetch failed: ${res.status}`);
    const html = await res.text();
    const ogBlock = this.extractOgBlock(html);
    return `[RESOLVED_URL]: ${resolved}\n\n${ogBlock}\n\n${html.slice(0, 4000)}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }

  private async resolveRedirect(url: string): Promise<string> {
    try {
      return await safeResolveRedirectUrl(url, 3);
    } catch {
      return url;
    }
  }
}
