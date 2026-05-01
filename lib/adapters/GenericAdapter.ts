import type { Adapter } from './types';
import { USER_AGENT } from './pipeline';
import { safeFetch } from './safe-fetch';

export class GenericAdapter implements Adapter {
  readonly sourceType = 'manual' as const;

  matches(_url: string): boolean {
    return true;
  }

  async fetch(url: string): Promise<string> {
    const res = await safeFetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Generic fetch failed: ${res.status}`);
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
