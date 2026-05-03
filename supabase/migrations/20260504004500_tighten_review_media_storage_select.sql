-- Keep review media objects private at Storage level.
-- Public review media should be served via server-created signed URLs, not broad bucket reads.

DROP POLICY IF EXISTS "review_media_objects_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "review_media_objects_select_owner" ON storage.objects;
CREATE POLICY "review_media_objects_select_owner"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'review-media' AND owner = (select auth.uid()));
