# UX Policy

Last updated: 2026-05-03

## Onboarding

- The normal user path is login-first.
- Google login is the first supported provider.
- Apple login should be added later for web and iOS.
- The MVP should create a couple space by default.
- Friend mode should not appear in normal user-facing onboarding.

## Demo Policy

- Do not mix demo data with real user data.
- Do not use localStorage guest mode as the main product experience.
- If a demo is needed, build a logged-in sample couple space and clearly label it as sample data.

## Couple Memory

- AI memory must be opt-in.
- Users must be able to view, edit, and delete extracted couple memories.
- Use retrieval from a private couple memory database, not model fine-tuning on private conversations.
- Avoid wording that implies the model permanently learns from private user data.
- Partner profiles must be editable summaries, not hidden judgments.
- Gift recommendations and conflict support should be helpful assistants, not authority figures.

## Media Storage And Privacy

- Review images and videos are stored in Supabase Storage.
- The database stores metadata such as `storage_path`, media type, sort order, and review linkage.
- Prefer private buckets and signed URL/API-mediated delivery.
- Public reviews may display their attached media to other users only when `community_reviews.is_public = true`.
- Private couple records and unshared visit media should remain visible only to the couple/group.
- Do not store raw image/video binaries directly in Postgres tables.

## Reviews

- Keep short, low-friction review creation.
- Support manual text, but do not require long writing.
- Prefer structured inputs:
  - rating
  - amount
  - tags
  - images
  - short video
  - AI-generated short review draft

## Global UX

- UI strings should be translated by locale.
- User-generated reviews should keep the original language and store fixed translations at creation time.
- Korea should use Kakao Maps first.
- Non-Korea map providers can branch to Google Maps later.
