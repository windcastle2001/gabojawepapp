import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';

/**
 * GenericAdapter
 *
 * 매칭되는 전용 어댑터가 없을 때, 또는 전용 어댑터 fetch 실패 시
 * fallback으로 사용한다.
 * OG 메타 태그 + <article> 본문 1500자를 Gemini에 전달한다.
 * source_type은 pipeline 레벨에서 'manual'로 오버라이드된다.
 */
export class GenericAdapter implements Adapter {
  readonly sourceType = 'manual' as const;

  matches(_url: string): boolean {
    // 레지스트리 마지막에 등록되어 항상 true를 반환하므로
    // selectAdapter의 기본값으로 사용된다.
    return true;
  }

  async fetch(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Generic fetch 실패: ${res.status}`);
    const html = await res.text();
    return this.extractRelevantContent(html, url);
  }

  private extractRelevantContent(html: string, sourceUrl: string): string {
    const ogBlock = this.extractOgBlock(html);
    const articleText = this.extractArticleText(html);
    return `[SOURCE_URL]: ${sourceUrl}\n\n[OG_META]:\n${ogBlock}\n\n[ARTICLE_TEXT]:\n${articleText}`;
  }

  private extractOgBlock(html: string): string {
    const metaPattern = /<meta[^>]+(?:og:|twitter:)[^>]+>/gi;
    const matches = html.match(metaPattern) ?? [];
    return matches.slice(0, 20).join('\n');
  }

  private extractArticleText(html: string): string {
    // <article> 태그 우선, 없으면 <main>, 없으면 <body>
    const articleMatch =
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ??
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    const rawBlock = articleMatch ? articleMatch[1] : html;
    return rawBlock
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 1500);
  }
}
