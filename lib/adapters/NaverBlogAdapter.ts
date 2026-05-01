import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';
import { safeFetch } from './safe-fetch';

export class NaverBlogAdapter implements Adapter {
  readonly sourceType = 'naver_blog' as const;

  matches(url: string): boolean {
    return /blog\.naver\.com|m\.blog\.naver\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    const iframeUrl = this.buildIframeUrl(url);

    if (iframeUrl) {
      try {
        const res = await safeFetch(iframeUrl, {
          headers: {
            'User-Agent': USER_AGENT,
            Referer: 'https://blog.naver.com/',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const html = await res.text();
          return this.extractContent(html, url);
        }
      } catch {
        // Fall back to the original URL below.
      }
    }

    const res = await safeFetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Naver blog fetch failed: ${res.status}`);
    const html = await res.text();
    return this.extractContent(html, url);
  }

  private buildIframeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const [userId, logNo] = segments;
        return `https://blog.naver.com/PostView.naver?blogId=${userId}&logNo=${logNo}&isInNoticeList=false`;
      }

      const blogId = parsed.searchParams.get('blogId');
      const logNo = parsed.searchParams.get('logNo');
      if (blogId && logNo) {
        return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&isInNoticeList=false`;
      }
      return null;
    } catch {
      return null;
    }
  }

  private extractContent(html: string, sourceUrl: string): string {
    const ogBlock = this.extractOgBlock(html);
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 1500);

    return `[SOURCE_URL]: ${sourceUrl}\n\n${ogBlock}\n\n[BODY_TEXT]:\n${bodyText}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }
}
