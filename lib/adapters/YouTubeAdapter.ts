import { assertSafeFetchUrl, safeFetch } from './safe-fetch';
import type { Adapter } from './types';

export class YouTubeAdapter implements Adapter {
  readonly sourceType = 'youtube' as const;

  matches(url: string): boolean {
    return /youtube\.com\/(watch|shorts)|youtu\.be\//.test(url);
  }

  async fetch(url: string): Promise<string> {
    const safeUrl = await assertSafeFetchUrl(url);
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(safeUrl.href)}&format=json`;
    const res = await safeFetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`YouTube oEmbed failed: ${res.status}`);

    const data = (await res.json()) as Record<string, unknown>;
    const videoId = this.extractVideoId(safeUrl.href);
    const enriched = {
      ...data,
      video_id: videoId,
      source_url: safeUrl.href,
      thumbnail_hq: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    };

    return JSON.stringify(enriched);
  }

  private extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'youtu.be') {
        return parsed.pathname.slice(1);
      }

      const v = parsed.searchParams.get('v');
      if (v) return v;

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      return null;
    } catch {
      return null;
    }
  }
}
