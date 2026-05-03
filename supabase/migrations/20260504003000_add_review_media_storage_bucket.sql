-- Private media bucket for review images and short videos.
-- DB stores storage paths in review_media.storage_path. Public/private delivery should use signed URLs or API mediation.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "review_media_objects_select_authenticated" ON storage.objects;
CREATE POLICY "review_media_objects_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "review_media_objects_insert_authenticated" ON storage.objects;
CREATE POLICY "review_media_objects_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND owner = (select auth.uid()));

DROP POLICY IF EXISTS "review_media_objects_update_owner" ON storage.objects;
CREATE POLICY "review_media_objects_update_owner"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'review-media' AND owner = (select auth.uid()))
  WITH CHECK (bucket_id = 'review-media' AND owner = (select auth.uid()));

DROP POLICY IF EXISTS "review_media_objects_delete_owner" ON storage.objects;
CREATE POLICY "review_media_objects_delete_owner"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'review-media' AND owner = (select auth.uid()));
