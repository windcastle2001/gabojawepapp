import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Lazy initialization — 빌드 타임에 환경변수가 없어도 에러 방지
let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');

  _adminClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

// 기존 코드와의 호환성을 위한 proxy export
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') return val.bind(client);
    return val;
  },
});
