-- Harden group capacity checks and group update permissions.

CREATE OR REPLACE FUNCTION public.fn_check_group_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_current_count integer;
  v_max_members   integer;
  v_group_type    text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.group_id::text));

  SELECT g.max_members, g.group_type
  INTO   v_max_members, v_group_type
  FROM   public.groups g
  WHERE  g.id = NEW.group_id;

  SELECT COUNT(*)
  INTO   v_current_count
  FROM   public.group_members gm
  WHERE  gm.group_id = NEW.group_id;

  IF v_current_count >= v_max_members THEN
    RAISE EXCEPTION
      'Group member limit reached. group_type=%, max_members=%, current=%',
      v_group_type, v_max_members, v_current_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "groups_update_member" ON public.groups;
DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner"
  ON public.groups
  FOR UPDATE
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));
