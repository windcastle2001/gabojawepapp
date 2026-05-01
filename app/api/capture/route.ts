import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getRateLimitIdentifier } from '@/lib/rate-limit';
import { parseUrl } from '@/lib/adapters/pipeline';
import type { Database } from '@/types/database';

// 클라이언트 노출 에러 코드 — 내부 상세 내용은 서버 로그에만 기록
const ErrorCode = {
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PARSE_FAILED: 'PARSE_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

function errorResponse(
  message: string,
  code: ErrorCodeType,
  status: number,
): NextResponse {
  return NextResponse.json(
    { error: message, code, timestamp: new Date().toISOString() },
    { status },
  );
}

// Rate limiter: IP당 10회/분
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'datemate:capture',
});

const CaptureSchema = z.object({
  url: z.string().url('유효한 URL을 입력해주세요'),
});

export async function POST(req: NextRequest) {
  // 1. 인증 확인 (user.id를 Rate Limit identifier로 사용하기 위해 선행)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('로그인이 필요합니다.', ErrorCode.UNAUTHORIZED, 401);
  }

  // 2. Rate limit 확인
  // 인증된 유저 ID를 식별자로 사용 → IP 변경(VPN/프록시)으로 우회 불가능
  const identifier = getRateLimitIdentifier(req, user.id);
  const { success: rateLimitOk } = await ratelimit.limit(identifier);
  if (!rateLimitOk) {
    return errorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', ErrorCode.RATE_LIMITED, 429);
  }

  // 3. 요청 바디 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('잘못된 요청 형식입니다.', ErrorCode.INVALID_JSON, 400);
  }

  // 4. 입력값 검증
  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('유효하지 않은 URL입니다.', ErrorCode.VALIDATION_ERROR, 422);
  }

  // 5. URL 파싱 실행 (내부 에러는 서버 로그에만 기록)
  let result: Awaited<ReturnType<typeof parseUrl>>;
  try {
    result = await parseUrl(parsed.data.url);
  } catch (err) {
    // 스택 트레이스는 서버 로그에만 — 클라이언트에 노출 금지
    console.error('[capture/route] parseUrl 처리 중 예외:', err instanceof Error ? err.message : String(err));
    return errorResponse('링크 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', ErrorCode.INTERNAL_ERROR, 500);
  }

  // 6. 캡처 로그 기록 (비동기, 실패해도 응답에 영향 없음)
  // @supabase/ssr 0.5.x + supabase-js 2.103.x 간 내부 타입 경로 불일치로
  // createServerClient<Database>의 Schema 제네릭 추론이 실패함.
  // Insert 페이로드를 Database 타입으로 명시 선언하여 타입 안전성 확보.
  const captureLogInsert: Database['public']['Tables']['capture_logs']['Insert'] = {
    user_id: user.id,
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
      if (error) {
        // DB 로그 실패는 서버 로그에만 기록
        console.error('[capture/route] 로그 기록 실패:', error.message);
      }
    });

  // 7. 응답 — 파싱 실패 시 generic 메시지 반환 (result.error는 내부용)
  if (!result.success) {
    // 내부 에러 상세는 서버 로그에만
    if (result.error) {
      console.error('[capture/route] 파싱 실패:', result.error);
    }
    return errorResponse('링크를 분석하지 못했습니다. URL을 확인하고 다시 시도해주세요.', ErrorCode.PARSE_FAILED, 422);
  }

  return NextResponse.json(
    { data: result.payload, cached: result.cached },
    { status: 200 },
  );
}
