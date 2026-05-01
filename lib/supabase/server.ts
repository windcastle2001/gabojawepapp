import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (err) {
            // Server Component의 읽기 전용 컨텍스트에서 쿠키 설정 시 발생하는 예상된 오류.
            // middleware에서 세션 갱신을 처리하므로 무시해도 안전함.
            // 개발 환경에서만 경고 로그 출력 (프로덕션에서는 노이즈 방지)
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '[supabase/server] cookies().set() 실패 — Server Component 읽기 전용 컨텍스트. middleware에서 세션이 갱신되는 경우 무시해도 됩니다.',
                err,
              );
            }
          }
        },
      },
    }
  );
}
