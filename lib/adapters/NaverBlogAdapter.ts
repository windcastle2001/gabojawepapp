import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

export class NaverBlogAdapter implements Adapter {
  readonly sourceType = 'naver_blog' as const;

  matches(url: string): boolean {
    return /blog\.naver\.com|m\.blog\.naver\.com/.test(url);
  }

  async fetch(url: string): Promise<string> {
    // 네이버 블로그 본문은 iframe 내부 URL에 위치
    // 패턴: blog.naver.com/{userId}/{logNo} → PostView.naver?blogId=...&logNo=...
    const iframeUrl = this.buildIframeUrl(url);

    if (iframeUrl) {
      try {
        const res = await fetch(iframeUrl, {
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
        // iframe 접근 실패 시 OG fallback으로 진행
      }
    }

    // Fallback: 원본 URL의 OG 메타만 반환
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`네이버블로그 fetch 실패: ${res.status}`);
    const html = await res.text();
    return this.extractContent(html, url);
  }

  /**
   * 네이버 블로그 PC 본문 iframe URL 조합
   * blog.naver.com/userId/logNo → PostView.naver?blogId=userId&logNo=logNo
   */
  private buildIframeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      // 패턴: /userId/logNo
      if (segments.length >= 2) {
        const [userId, logNo] = segments;
        return `https://blog.naver.com/PostView.naver?blogId=${userId}&logNo=${logNo}&isInNoticeList=false`;
      }
      // 쿼리스트링 방식: ?blogId=...&logNo=...
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
    // 본문 텍스트 추출 (태그 제거 후 1500자)
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
