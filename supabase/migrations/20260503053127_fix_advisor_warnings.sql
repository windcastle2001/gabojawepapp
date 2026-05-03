-- Resolve Supabase advisor warnings:
-- 1. Cache auth.uid() calls in RLS policies with initPlan-friendly SELECT wrappers.
-- 2. Merge community_reviews SELECT policies to avoid multiple permissive policy warnings.
-- 3. Pin fn_set_updated_at search_path.
-- 4. Move pg_trgm out of public and into extensions.

CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION "pg_trgm" SET SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_my_couple_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id
  FROM   public.couples
  WHERE  user1_id = (select auth.uid())
     OR  user2_id = (select auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.fn_my_group_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT ARRAY(
    SELECT group_id
    FROM   public.group_members
    WHERE  user_id = (select auth.uid())
  );
$$;

DROP POLICY IF EXISTS "users_select_self_or_partner" ON public.users;
CREATE POLICY "users_select_self_or_partner"
  ON public.users
  FOR SELECT
  USING (
    id = (select auth.uid())
    OR id = (
      SELECT partner_id FROM public.users WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self"
  ON public.users
  FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self"
  ON public.users
  FOR INSERT
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "couples_access_own" ON public.couples;
CREATE POLICY "couples_access_own"
  ON public.couples
  FOR SELECT
  USING (
    user1_id = (select auth.uid())
    OR user2_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "couples_insert_self" ON public.couples;
CREATE POLICY "couples_insert_self"
  ON public.couples
  FOR INSERT
  WITH CHECK (user1_id = (select auth.uid()));

DROP POLICY IF EXISTS "couples_update_own" ON public.couples;
CREATE POLICY "couples_update_own"
  ON public.couples
  FOR UPDATE
  USING (
    user1_id = (select auth.uid())
    OR user2_id = (select auth.uid())
  )
  WITH CHECK (
    user1_id = (select auth.uid())
    OR user2_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "couples_delete_own" ON public.couples;
CREATE POLICY "couples_delete_own"
  ON public.couples
  FOR DELETE
  USING (user1_id = (select auth.uid()));

DROP POLICY IF EXISTS "wishlist_insert_own_couple" ON public.wishlist;
CREATE POLICY "wishlist_insert_own_couple"
  ON public.wishlist
  FOR INSERT
  WITH CHECK (
    couple_id IN (SELECT public.fn_my_couple_ids())
    AND added_by = (select auth.uid())
  );

DROP POLICY IF EXISTS "public_places_select_all" ON public.public_places;
CREATE POLICY "public_places_select_all"
  ON public.public_places
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "public_places_insert_self" ON public.public_places;
CREATE POLICY "public_places_insert_self"
  ON public.public_places
  FOR INSERT
  WITH CHECK (contributed_by = (select auth.uid()));

DROP POLICY IF EXISTS "public_places_update_self" ON public.public_places;
CREATE POLICY "public_places_update_self"
  ON public.public_places
  FOR UPDATE
  USING (contributed_by = (select auth.uid()))
  WITH CHECK (contributed_by = (select auth.uid()));

DROP POLICY IF EXISTS "system_configs_admin_only" ON public.system_configs;
CREATE POLICY "system_configs_admin_only"
  ON public.system_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "capture_logs_own" ON public.capture_logs;
CREATE POLICY "capture_logs_own"
  ON public.capture_logs
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "capture_cache_read_valid" ON public.capture_cache;
CREATE POLICY "capture_cache_read_valid"
  ON public.capture_cache
  FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
    AND expires_at > now()
  );

DROP POLICY IF EXISTS "groups_insert_self" ON public.groups;
CREATE POLICY "groups_insert_self"
  ON public.groups
  FOR INSERT
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner"
  ON public.groups
  FOR DELETE
  USING (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "group_members_insert_self" ON public.group_members;
CREATE POLICY "group_members_insert_self"
  ON public.group_members
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "group_members_delete_self_or_owner" ON public.group_members;
CREATE POLICY "group_members_delete_self_or_owner"
  ON public.group_members
  FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE  gm2.group_id = group_id
        AND  gm2.user_id  = (select auth.uid())
        AND  gm2.role     = 'owner'
    )
  );

DROP POLICY IF EXISTS "community_reviews_select_public" ON public.community_reviews;
DROP POLICY IF EXISTS "community_reviews_select_private" ON public.community_reviews;
DROP POLICY IF EXISTS "community_reviews_select_visible" ON public.community_reviews;
CREATE POLICY "community_reviews_select_visible"
  ON public.community_reviews
  FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL
    AND (
      is_public = true
      OR user_id = (select auth.uid())
      OR group_id = ANY(public.fn_my_group_ids())
    )
  );

DROP POLICY IF EXISTS "community_reviews_insert_self" ON public.community_reviews;
CREATE POLICY "community_reviews_insert_self"
  ON public.community_reviews
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "community_reviews_update_self" ON public.community_reviews;
CREATE POLICY "community_reviews_update_self"
  ON public.community_reviews
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "community_reviews_delete_self" ON public.community_reviews;
CREATE POLICY "community_reviews_delete_self"
  ON public.community_reviews
  FOR DELETE
  USING (user_id = (select auth.uid()));
