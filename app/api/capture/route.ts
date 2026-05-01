import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { parseUrl } from '@/lib/adapters/pipeline';
import { getRateLimitIdentifier } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

const ErrorCode = {
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PARSE_FAILED: 'PARSE_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

const CaptureSchema = z.object({
  url: z.string().url('유효한 URL을 입력해 주세요.'),
});

let ratelimit: Ratelimit | null | undefined;

function getRatelimit() {
  if (ratelimit !== undefined) return ratelimit;

  const hasUpstashEnv = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!hasUpstashEnv) {
    ratelimit = null;
    return ratelimit;
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'gajago:capture',
  });
  return ratelimit;
}

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function errorResponse(message: string, code: ErrorCodeType, status: number) {
  return NextResponse.json({ error: message, code, timestamp: new Date().toISOString() }, { status });
}

export async function POST(req: NextRequest) {
  const prototypeMode = process.env.PROTOTYPE_MODE === 'true';
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let user: { id: string } | null = null;

  if (hasSupabaseEnv()) {
    try {
      supabase = await createClient();
      const auth = await supabase.auth.getUser();
      user = auth.data.user;
    } catch (error) {
      if (!prototypeMode) {
        console.error('[capture/route] Supabase auth failed:', error);
        return errorResponse('인증 정보를 확인하지 못했습니다.', ErrorCode.UNAUTHORIZED, 401);
      }
    }
  }

  if (!user && !prototypeMode) {
    return errorResponse('로그인이 필요합니다.', ErrorCode.UNAUTHORIZED, 401);
  }

  const limiter = getRatelimit();
  if (limiter) {
    const identifier = getRateLimitIdentifier(req, user?.id ?? 'prototype-user');
    const { success: rateLimitOk } = await limiter.limit(identifier);
    if (!rateLimitOk) {
      return errorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', ErrorCode.RATE_LIMITED, 429);
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('잘못된 JSON 요청입니다.', ErrorCode.INVALID_JSON, 400);
  }

  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('유효한 URL을 입력해 주세요.', ErrorCode.VALIDATION_ERROR, 422);
  }

  let result: Awaited<ReturnType<typeof parseUrl>>;
  try {
    result = await parseUrl(parsed.data.url);
  } catch (error) {
    console.error('[capture/route] parseUrl error:', error instanceof Error ? error.message : String(error));
    return errorResponse('링크 분석 중 오류가 발생했습니다.', ErrorCode.INTERNAL_ERROR, 500);
  }

  if (supabase) {
    const captureLogInsert: Database['public']['Tables']['capture_logs']['Insert'] = {
      user_id: user?.id ?? 'prototype-user',
      source_url: parsed.data.url,
      source_type: result.payload?.source_type ?? null,
      success: result.success,
      error_msg: result.error ?? null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('capture_logs')
      .insert(captureLogInsert)
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error('[capture/route] capture log insert failed:', error.message);
      });
  }

  if (!result.success) {
    if (result.error) console.error('[capture/route] parse failed:', result.error);
    return errorResponse(
      '링크를 분석하지 못했습니다. 링크를 확인하고 다시 시도해 주세요.',
      ErrorCode.PARSE_FAILED,
      422,
    );
  }

  return NextResponse.json({ data: result.payload, cached: result.cached }, { status: 200 });
}
