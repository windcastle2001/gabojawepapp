import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { selectAdapter } from './registry';
import { extractWithGemini } from '@/lib/ai/extract';
import type { NormalizedPayload, AdapterResult } from './types';

export const USER_AGENT = 'GajagoBot/1.0 (+https://gajago.kr/bot)';

const CACHE_TTL_HOURS = 24;

/**
 * 공통 URL 파싱 파이프라인
 *
 * 1. URL 유효성 검증
 * 2. capture_cache 24시간 캐시 히트 확인
 * 3. 어댑터 선택 및 raw 콘텐츠 fetch
 * 4. Gemini Flash JSON 추출
 * 5. 결과 캐시 저장 (upsert)
 */
export async function parseUrl(rawUrl: string): Promise<AdapterResult> {
  // 1. URL 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { success: false, error: '유효하지 않은 URL입니다.', cached: false };
  }

  const urlHash = crypto.createHash('sha256').update(parsedUrl.href).digest('hex');

  // 2. 캐시 히트 체크
  const { data: cached } = await supabaseAdmin
    .from('capture_cache')
    .select('payload')
    .eq('url_hash', urlHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached?.payload) {
    return { success: true, payload: cached.payload as unknown as NormalizedPayload, cached: true };
  }

  // 3. 어댑터 선택 및 raw 콘텐츠 fetch
  const adapter = selectAdapter(parsedUrl.href);

  let rawContent: string;
  try {
    rawContent = await adapter.fetch(parsedUrl.href);
  } catch (adapterErr) {
    // 전용 어댑터 fetch 실패 → GenericAdapter로 fallback
    const { GenericAdapter } = await import('./GenericAdapter');
    try {
      rawContent = await new GenericAdapter().fetch(parsedUrl.href);
    } catch {
      return {
        success: false,
        error: `페이지를 가져올 수 없습니다: ${(adapterErr as Error).message}`,
        cached: false,
      };
    }
  }

  // 4. Gemini Flash JSON 추출
  let payload: NormalizedPayload;
  try {
    payload = await extractWithGemini(rawContent, parsedUrl.href, adapter.sourceType);
  } catch {
    // Gemini 실패 시 최소 payload로 데이터 유실 방지
    payload = {
      title: parsedUrl.hostname,
      category: '기타',
      source_url: parsedUrl.href,
      source_type: adapter.sourceType,
    };
  }

  // 5. 캐시 저장 (24시간 TTL)
  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from('capture_cache').upsert({
    url_hash: urlHash,
    payload: payload as unknown as Record<string, unknown>,
    expires_at: expiresAt,
  });

  return { success: true, payload, cached: false };
}
