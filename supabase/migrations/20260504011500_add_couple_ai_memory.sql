-- Add transparent, editable couple AI memory primitives.
-- These tables store user-visible facts and profile summaries for retrieval, not model fine-tuning.

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  birthday date,
  mbti text,
  zodiac text,
  personality_summary text,
  gift_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  food_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  date_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  important_notes text[] NOT NULL DEFAULT '{}',
  ai_opt_in boolean NOT NULL DEFAULT false,
  last_ai_refresh_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_partner_profiles_group_user UNIQUE (group_id, user_id),
  CONSTRAINT chk_partner_profiles_mbti CHECK (mbti IS NULL OR mbti ~* '^(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)$')
);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_group_id
  ON public.partner_profiles(group_id);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_profiles_select_member" ON public.partner_profiles;
CREATE POLICY "partner_profiles_select_member"
  ON public.partner_profiles
  FOR SELECT
  USING (group_id = ANY(public.fn_my_group_ids()));

DROP POLICY IF EXISTS "partner_profiles_insert_self" ON public.partner_profiles;
CREATE POLICY "partner_profiles_insert_self"
  ON public.partner_profiles
  FOR INSERT
  WITH CHECK (group_id = ANY(public.fn_my_group_ids()) AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "partner_profiles_update_self" ON public.partner_profiles;
CREATE POLICY "partner_profiles_update_self"
  ON public.partner_profiles
  FOR UPDATE
  USING (group_id = ANY(public.fn_my_group_ids()) AND user_id = (select auth.uid()))
  WITH CHECK (group_id = ANY(public.fn_my_group_ids()) AND user_id = (select auth.uid()));

DROP POLICY IF EXISTS "partner_profiles_delete_self" ON public.partner_profiles;
CREATE POLICY "partner_profiles_delete_self"
  ON public.partner_profiles
  FOR DELETE
  USING (group_id = ANY(public.fn_my_group_ids()) AND user_id = (select auth.uid()));

CREATE OR REPLACE TRIGGER trg_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE IF NOT EXISTS public.couple_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  subject_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memory_type text NOT NULL DEFAULT 'preference' CHECK (memory_type IN ('preference', 'constraint', 'gift', 'conflict_style', 'anniversary', 'inside_joke', 'place', 'manual_note')),
  title text NOT NULL,
  content text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'chat', 'review', 'wishlist', 'ai_suggestion')),
  source_ref_id uuid,
  confidence numeric NOT NULL DEFAULT 1 CHECK (confidence >= 0 AND confidence <= 1),
  visibility text NOT NULL DEFAULT 'couple' CHECK (visibility IN ('couple', 'self_only')),
  is_ai_usable boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couple_memories_group_active
  ON public.couple_memories(group_id, archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_couple_memories_subject
  ON public.couple_memories(subject_user_id);

ALTER TABLE public.couple_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple_memories_select_member" ON public.couple_memories;
CREATE POLICY "couple_memories_select_member"
  ON public.couple_memories
  FOR SELECT
  USING (
    group_id = ANY(public.fn_my_group_ids())
    AND (visibility = 'couple' OR created_by = (select auth.uid()) OR subject_user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "couple_memories_insert_member" ON public.couple_memories;
CREATE POLICY "couple_memories_insert_member"
  ON public.couple_memories
  FOR INSERT
  WITH CHECK (group_id = ANY(public.fn_my_group_ids()) AND created_by = (select auth.uid()));

DROP POLICY IF EXISTS "couple_memories_update_creator_or_subject" ON public.couple_memories;
CREATE POLICY "couple_memories_update_creator_or_subject"
  ON public.couple_memories
  FOR UPDATE
  USING (
    group_id = ANY(public.fn_my_group_ids())
    AND (created_by = (select auth.uid()) OR subject_user_id = (select auth.uid()))
  )
  WITH CHECK (
    group_id = ANY(public.fn_my_group_ids())
    AND (created_by = (select auth.uid()) OR subject_user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "couple_memories_delete_creator_or_subject" ON public.couple_memories;
CREATE POLICY "couple_memories_delete_creator_or_subject"
  ON public.couple_memories
  FOR DELETE
  USING (
    group_id = ANY(public.fn_my_group_ids())
    AND (created_by = (select auth.uid()) OR subject_user_id = (select auth.uid()))
  );

CREATE OR REPLACE TRIGGER trg_couple_memories_updated_at
  BEFORE UPDATE ON public.couple_memories
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
