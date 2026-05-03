-- Add group-scoped persistence for couple MVP wishlist, visits, media, votes, and global-ready places.

CREATE TABLE IF NOT EXISTS public.group_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  item_type text NOT NULL DEFAULT 'place' CHECK (item_type IN ('place', 'activity')),
  category text NOT NULL DEFAULT '기타',
  address text,
  lat numeric,
  lng numeric,
  tags text[] NOT NULL DEFAULT '{}',
  added_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  source_type text NOT NULL DEFAULT 'manual',
  source_label text,
  source_url text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rating numeric CHECK (rating >= 1 AND rating <= 5),
  review_content text,
  amount numeric CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'KRW',
  shared_review_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_wishlist_group_completed
  ON public.group_wishlist(group_id, is_completed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_wishlist_added_by
  ON public.group_wishlist(added_by);

ALTER TABLE public.group_wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_wishlist_select_member" ON public.group_wishlist;
CREATE POLICY "group_wishlist_select_member"
  ON public.group_wishlist
  FOR SELECT
  USING (group_id = ANY(public.fn_my_group_ids()));

DROP POLICY IF EXISTS "group_wishlist_insert_member" ON public.group_wishlist;
CREATE POLICY "group_wishlist_insert_member"
  ON public.group_wishlist
  FOR INSERT
  WITH CHECK (group_id = ANY(public.fn_my_group_ids()) AND added_by = (select auth.uid()));

DROP POLICY IF EXISTS "group_wishlist_update_member" ON public.group_wishlist;
CREATE POLICY "group_wishlist_update_member"
  ON public.group_wishlist
  FOR UPDATE
  USING (group_id = ANY(public.fn_my_group_ids()))
  WITH CHECK (group_id = ANY(public.fn_my_group_ids()));

DROP POLICY IF EXISTS "group_wishlist_delete_member" ON public.group_wishlist;
CREATE POLICY "group_wishlist_delete_member"
  ON public.group_wishlist
  FOR DELETE
  USING (group_id = ANY(public.fn_my_group_ids()));

CREATE OR REPLACE TRIGGER trg_group_wishlist_updated_at
  BEFORE UPDATE ON public.group_wishlist
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.public_places
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'KR',
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS place_provider text,
  ADD COLUMN IF NOT EXISTS provider_place_id text,
  ADD COLUMN IF NOT EXISTS source_url text;

CREATE INDEX IF NOT EXISTS idx_public_places_country_region_category
  ON public.public_places(country_code, region, category);

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_places_provider_id
  ON public.public_places(place_provider, provider_place_id)
  WHERE place_provider IS NOT NULL AND provider_place_id IS NOT NULL;

ALTER TABLE public.community_reviews
  ADD COLUMN IF NOT EXISTS amount numeric CHECK (amount >= 0),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'KRW',
  ADD COLUMN IF NOT EXISTS original_language text NOT NULL DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recommendation_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.community_reviews(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_media_order UNIQUE (review_id, sort_order)
);

ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_media_select_public_review" ON public.review_media;
CREATE POLICY "review_media_select_public_review"
  ON public.review_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_reviews cr
      WHERE cr.id = review_media.review_id AND cr.is_public = true
    )
  );

DROP POLICY IF EXISTS "review_media_insert_own_review" ON public.review_media;
CREATE POLICY "review_media_insert_own_review"
  ON public.review_media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_reviews cr
      WHERE cr.id = review_media.review_id AND cr.user_id = (select auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS public.review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.community_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL DEFAULT 'recommend' CHECK (vote_type IN ('recommend')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_review_votes_review_user UNIQUE (review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_votes_select_all" ON public.review_votes;
CREATE POLICY "review_votes_select_all"
  ON public.review_votes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "review_votes_insert_self" ON public.review_votes;
CREATE POLICY "review_votes_insert_self"
  ON public.review_votes
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "review_votes_delete_self" ON public.review_votes;
CREATE POLICY "review_votes_delete_self"
  ON public.review_votes
  FOR DELETE
  USING (user_id = (select auth.uid()));

CREATE OR REPLACE FUNCTION public.fn_update_review_recommendation_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_reviews
    SET recommendation_count = recommendation_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.community_reviews
    SET recommendation_count = GREATEST(recommendation_count - 1, 0)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_votes_recommendation_count ON public.review_votes;
CREATE TRIGGER trg_review_votes_recommendation_count
  AFTER INSERT OR DELETE ON public.review_votes
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_review_recommendation_count();
