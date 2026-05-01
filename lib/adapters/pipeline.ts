import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractWithGemini } from '@/lib/ai/extract';
import { assertSafeFetchUrl } from './safe-fetch';
import { selectAdapter } from './registry';
import type { AdapterResult, NormalizedPayload } from './types';

export const USER_AGENT = 'GajagoBot/1.0 (+https://gajago.kr/bot)';

const CACHE_TTL_HOURS = 24;

export async function parseUrl(rawUrl: string): Promise<AdapterResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = await assertSafeFetchUrl(rawUrl);
  } catch {
    return { success: false, error: '허용되지 않는 URL입니다.', cached: false };
  }

  const urlHash = crypto.createHash('sha256').update(parsedUrl.href).digest('hex');
  const cacheEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (cacheEnabled) {
    try {
      const { data: cached } = await supabaseAdmin
        .from('capture_cache')
        .select('payload')
        .eq('url_hash', urlHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached?.payload) {
        return { success: true, payload: cached.payload as unknown as NormalizedPayload, cached: true };
      }
    } catch {
      // Cache misses or schema gaps should not block capture in prototype mode.
    }
  }

  const adapter = selectAdapter(parsedUrl.href);

  let rawContent: string;
  try {
    rawContent = await adapter.fetch(parsedUrl.href);
  } catch (adapterErr) {
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

  let payload: NormalizedPayload;
  try {
    payload = await extractWithGemini(rawContent, parsedUrl.href, adapter.sourceType);
  } catch {
    payload = {
      title: parsedUrl.hostname,
      category: '기타',
      source_url: parsedUrl.href,
      source_type: adapter.sourceType,
    };
  }

  if (cacheEnabled) {
    try {
      await supabaseAdmin.from('capture_cache').upsert({
        url_hash: urlHash,
        payload: payload as unknown as Record<string, unknown>,
        expires_at: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString(),
      });
    } catch {
      // Capture should still succeed even if cache persistence is unavailable.
    }
  }

  return { success: true, payload, cached: false };
}
