import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest } from 'next/server';

/**
 * Rate Limit 식별자 추출 함수
 *
 * 우선순위:
 * 1. 인증된 유저 ID — IP 변경으로 우회 불가능
 * 2. x-real-ip — Vercel Edge Network에서 주입하는 신뢰 가능한 IP
 * 3. x-forwarded-for — TRUST_PROXY_DEPTH 기준 오른쪽에서 역산 (클라이언트 조작 방지)
 * 4. anonymous fallback
 *
 * 보안 원칙:
 * - x-forwarded-for의 첫 번째 값은 클라이언트가 직접 쓸 수 있으므로 절대 신뢰 금지
 * - 인증된 요청은 user.id로 제한해야 VPN/프록시 우회를 차단할 수 있음
 */
export function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  // 인증된 유저가 있으면 user.id 사용 (IP 우회 원천 차단)
  if (userId) {
    return `user:${userId}`;
  }

  // Vercel Edge Network가 주입하는 검증된 IP 헤더
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp?.trim()) {
    return `ip:${xRealIp.trim()}`;
  }

  // x-forwarded-for: 신뢰 프록시 depth 기반으로 실제 클라이언트 IP 역산
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      // TRUST_PROXY_DEPTH: 서버 앞에 있는 신뢰 프록시 수 (기본 1 = Vercel만)
      const rawDepth = parseInt(process.env.TRUST_PROXY_DEPTH ?? '1', 10);
      const depth = isNaN(rawDepth) || rawDepth < 1 ? 1 : rawDepth;
      // 오른쪽에서 depth만큼 제외한 마지막 항목 = 실제 클라이언트 IP
      const idx = Math.max(0, ips.length - depth);
      return `ip:${ips[idx]}`;
    }
  }

  return 'ip:anonymous';
}

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'rl:api',
});

export const aiRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rl:ai',
});

export const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, '15 m'),
  prefix: 'rl:auth',
});
