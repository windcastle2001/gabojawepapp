import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Database,
  Flag,
  MapPinned,
  Shield,
  Users,
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { upsertSystemConfig, updateUserRole } from './actions';

type CountKey =
  | 'users'
  | 'groups'
  | 'group_members'
  | 'public_places'
  | 'community_reviews'
  | 'capture_logs'
  | 'capture_cache';

async function getCount(table: CountKey) {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  detail: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-black text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/app');

  const [
    userCount,
    groupCount,
    memberCount,
    placeCount,
    reviewCount,
    captureLogCount,
    cacheCount,
    usersResult,
    logsResult,
    configsResult,
    groupsResult,
  ] = await Promise.all([
    getCount('users'),
    getCount('groups'),
    getCount('group_members'),
    getCount('public_places'),
    getCount('community_reviews'),
    getCount('capture_logs'),
    getCount('capture_cache'),
    admin.from('users').select('id, email, name, role, created_at').order('created_at', { ascending: false }).limit(8),
    admin.from('capture_logs').select('id, source_type, source_url, success, error_msg, created_at').order('created_at', { ascending: false }).limit(12),
    admin.from('system_configs').select('id, config_key, config_value, updated_at').order('config_key', { ascending: true }).limit(30),
    admin.from('groups').select('id, name, group_type, max_members, is_active, invite_code, created_at').order('created_at', { ascending: false }).limit(8),
  ]);

  const users = usersResult.data ?? [];
  const logs = logsResult.data ?? [];
  const configs = configsResult.data ?? [];
  const groups = groupsResult.data ?? [];
  const successCount = logs.filter((log) => log.success).length;
  const failureCount = logs.length - successCount;

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Admin only
            </div>
            <h1 className="text-2xl font-black text-foreground">관리 대시보드</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              사용자, 그룹, 캡처 로그, 기능 플래그를 한 곳에서 확인합니다.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
          >
            앱으로 돌아가기
          </Link>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="사용자" value={userCount} detail={`최근 ${users.length}명 표시`} icon={Users} />
          <StatCard title="그룹" value={groupCount} detail={`멤버 연결 ${memberCount}건`} icon={Database} />
          <StatCard title="공개 장소" value={placeCount} detail={`리뷰 ${reviewCount}건`} icon={MapPinned} />
          <StatCard title="캡처 로그" value={captureLogCount} detail={`캐시 ${cacheCount}건`} icon={Bot} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-border p-4">
              <h2 className="text-base font-bold text-foreground">캡처 로그</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                최근 링크 파싱 결과입니다. 성공 {successCount}건, 실패 {failureCount}건.
              </p>
            </div>
            <div className="divide-y divide-border">
              {logs.length ? (
                logs.map((log) => (
                  <div key={log.id} className="grid gap-3 p-4 md:grid-cols-[120px_1fr_120px] md:items-center">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
                      )}
                      <Badge variant={log.success ? 'success' : 'warning'}>{log.success ? '성공' : '실패'}</Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{log.source_url ?? '-'}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {log.source_type ?? 'unknown'} {log.error_msg ? `· ${log.error_msg}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground md:text-right">{formatDate(log.created_at)}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">아직 캡처 로그가 없습니다.</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Flag className="h-5 w-5 text-brand" aria-hidden />
              <h2 className="text-base font-bold text-foreground">기능 설정</h2>
            </div>
            <form action={upsertSystemConfig} className="mb-4 grid gap-2">
              <input
                name="key"
                placeholder="예: web_grounding"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <textarea
                name="value"
                placeholder="true / false / JSON / prompt text"
                rows={3}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button className="min-h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground">
                저장
              </button>
            </form>
            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="rounded-xl bg-muted p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{config.config_key}</p>
                    <span className="text-[11px] text-muted-foreground">{formatDate(config.updated_at)}</span>
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{config.config_value ?? '-'}</p>
                </div>
              ))}
              {!configs.length ? <p className="text-sm text-muted-foreground">등록된 설정이 없습니다.</p> : null}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="border-b border-border p-4">
              <h2 className="text-base font-bold text-foreground">사용자 관리</h2>
              <p className="mt-1 text-xs text-muted-foreground">권한 변경은 service role로 서버에서만 처리됩니다.</p>
            </div>
            <div className="divide-y divide-border">
              {users.map((item) => (
                <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_180px] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{item.email}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.name ?? '이름 없음'} · {formatDate(item.created_at)}</p>
                  </div>
                  <form action={updateUserRole} className="flex gap-2">
                    <input type="hidden" name="userId" value={item.id} />
                    <select
                      name="role"
                      defaultValue={item.role}
                      className="min-h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-semibold"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="min-h-10 rounded-xl bg-muted px-3 text-xs font-semibold text-foreground hover:bg-brand/10">
                      변경
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border p-4">
              <h2 className="text-base font-bold text-foreground">최근 그룹</h2>
              <p className="mt-1 text-xs text-muted-foreground">초대 코드와 활성 상태를 확인합니다.</p>
            </div>
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <div key={group.id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{group.name}</p>
                      <Badge variant={group.group_type === 'friends' ? 'secondary' : 'default'}>{group.group_type}</Badge>
                      <Badge variant={group.is_active ? 'success' : 'muted'}>{group.is_active ? 'active' : 'off'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      초대 {group.invite_code} · 최대 {group.max_members}명 · {formatDate(group.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {!groups.length ? <div className="p-8 text-center text-sm text-muted-foreground">아직 그룹이 없습니다.</div> : null}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
