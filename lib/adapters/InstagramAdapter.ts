import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

/**
 * InstagramAdapter
 *
 * 인스타그램은 로그인 없이 API 접근이 불가하므로
 * OG 메타 태그만 수집한다. 썸네일, 제목 등 기본 정보는
 * OG에서 얻을 수 있으나 본문 설명은 제한적이다.
 * 파싱 품질이 낮을 경우 프론트엔드에서 유저 입력을 보완 요청한다.
 */
export class InstagramAdapter implements Adapter {
  readonly sourceType = 'instagram' as const;

  matches(url: string): boolean {
    return /instagram\.com\/(p|reel)\//.test(url);
  }

  async fetch(url: string): Promise<string> {
    // 인스타그램은 봇 차단이 강하므로 일반 브라우저 User-Agent 시도
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`인스타그램 fetch 실패: ${res.status}`);
    const html = await res.text();

    // OG 블록만 추출
    const ogBlock = this.extractOgBlock(html);
    return `[SOURCE_URL]: ${url}\n[NOTE]: Instagram OG-only. User input may be needed for full details.\n\n${ogBlock}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }
}
