import type { Adapter } from './types';

export class YouTubeAdapter implements Adapter {
  readonly sourceType = 'youtube' as const;

  matches(url: string): boolean {
    return /youtube\.com\/(watch|shorts)|youtu\.be\//.test(url);
  }

  async fetch(url: string): Promise<string> {
    // oEmbed API는 공개 콘텐츠라면 인증 없이 제목, 썸네일, 채널명 반환
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`YouTube oEmbed 실패: ${res.status}`);

    const data = (await res.json()) as Record<string, unknown>;

    // oEmbed에 없는 설명(description)은 YouTube Data API v3 없이는 가져올 수 없음.
    // videoId만 추출해 구조화된 메타 문자열을 Gemini에 전달한다.
    const videoId = this.extractVideoId(url);
    const enriched = {
      ...data,
      video_id: videoId,
      source_url: url,
      // 썸네일 고화질 직접 구성
      thumbnail_hq: videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null,
    };

    return JSON.stringify(enriched);
  }

  private extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      // youtu.be/VIDEO_ID
      if (parsed.hostname === 'youtu.be') {
        return parsed.pathname.slice(1);
      }
      // youtube.com/watch?v=VIDEO_ID
      const v = parsed.searchParams.get('v');
      if (v) return v;
      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
      return null;
    } catch {
      return null;
    }
  }
}
