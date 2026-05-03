'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const ConfigSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_.-]+$/i),
  value: z.string().trim().max(2000),
});

const RoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['user', 'admin']),
});

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/app');

  return { admin, currentUserId: user.id };
}

export async function upsertSystemConfig(formData: FormData) {
  const { admin } = await requireAdmin();
  const parsed = ConfigSchema.safeParse({
    key: formData.get('key'),
    value: formData.get('value'),
  });

  if (!parsed.success) {
    throw new Error('설정 키와 값을 확인해 주세요.');
  }

  const { error } = await admin.from('system_configs').upsert(
    {
      config_key: parsed.data.key,
      config_value: parsed.data.value,
    },
    { onConflict: 'config_key' },
  );

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function updateUserRole(formData: FormData) {
  const { admin, currentUserId } = await requireAdmin();
  const parsed = RoleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  });

  if (!parsed.success) {
    throw new Error('유저와 권한 값을 확인해 주세요.');
  }

  if (parsed.data.userId === currentUserId && parsed.data.role !== 'admin') {
    throw new Error('You cannot remove your own admin access.');
  }

  if (parsed.data.role !== 'admin') {
    const { count, error: countError } = await admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (countError) throw new Error(countError.message);
    if ((count ?? 0) <= 1) {
      throw new Error('At least one admin account must remain.');
    }
  }

  const { error } = await admin
    .from('users')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.userId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}
