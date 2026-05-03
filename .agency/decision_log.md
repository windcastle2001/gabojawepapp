# Decision Log

## [2026-04-18] Public vs App Route Split

Decision: Keep public entry paths and authenticated app paths separated under `app/(public)` and `app/app`.

Reason:
- Public map and landing-style pages should stay reachable without auth.
- App workflows can stay gated without complicating every page.

## [2026-05-01] Couple Mode + Friends Mode Share One Community Map

Decision: Keep a single shared community map and distinguish reviews by `커플 리뷰` vs `친구 리뷰`.

Reason:
- A unified map fills faster and feels alive earlier.
- Filtering by review type is enough for the user experience at prototype stage.

## [2026-05-01] Kakao Maps Chosen As Primary Map Engine

Decision: Use Kakao Maps as the primary map engine, but keep a fallback map path so the prototype still works when Kakao is misconfigured.

Reason:
- Korean place UX matters most for this product.
- The prototype needs to stay explorable even before all external console settings are perfect.

## [2026-05-01] Wishlist Completion Can Publish To Community Map

Decision: Move community-share intent into the wishlist completion popup instead of forcing a second action from the completed card.

Reason:
- The original flow added friction after users had already finished the core action.
- Sharing at completion time better matches how people naturally leave a short review right after finishing a place.

## [2026-05-01] Community Map Needs Multiple Intake Paths

Decision: Add four intake paths to the community map flow:
- current-location `내 주변` filter
- manual `제보하기` modal
- Kakao place search results
- Naver/Kakao shared-link registration entry

Reason:
- Buttons that only look clickable break trust fast.
- The product becomes more convincing when users can add places from search, from links, and from manual memory without changing screens.

## [2026-05-01] Prototype Store Tracks Source Metadata

Decision: Extend local prototype data with `sourceType`, `sourceLabel`, and `sourceUrl` for wishlist items and community places.

Reason:
- Users need to see whether an item came from the community map, a search result, a shared link, or direct manual input.
- That metadata is also what lets map/search/link flows converge cleanly into one wishlist UI.

## [2026-05-02] Real Auth/Invite Spine Before Full DB Persistence

Decision: Add Supabase-backed group creation and join APIs now, while keeping wishlist and community map storage local until the next backend persistence pass.

Reason:
- Real invite acceptance needs a server-backed group record; localStorage cannot cross devices.
- Full wishlist/community persistence is a larger data migration and should be done as a focused backend step.
- The prototype can still show the intended product flow if login, invite, map, AI, and local pin creation all work coherently.

## [2026-05-02] Use Gemini 3 Flash Preview Only

Decision: Centralize all Gemini calls through `lib/ai/model.ts` and keep the model id as `gemini-3-flash-preview`.

Reason:
- The user explicitly requested a Gemini Flash-only path for cost control.
- The earlier `gemini-3.0-flash` value was not accepted by the live Gemini API, while `gemini-3-flash-preview` passed a live smoke call.

## [2026-05-03] Admin Route Is Separate From User App

Decision: Implement `/admin` as a server-rendered admin surface guarded by both Supabase session and `users.role = 'admin'`, separate from `/app`.

Reason:
- Operators need logs, feature flags, users, and group status without exposing those controls in the normal user navigation.
- A server route keeps service-role reads and role mutations off the client bundle.
- Normal users should be redirected back to `/app` if they are signed in but not admins.

## [2026-05-03] Use Session Pooler For Supabase CLI

Decision: Use the Supabase pooler session port `5432` for `db push`, `db advisors`, and smoke queries instead of transaction port `6543`.

Reason:
- Transaction pooler mode can reject prepared statements used by the Supabase CLI.
- Session port completed migrations, advisors, and smoke queries reliably.

## [2026-05-03] Harden Group And Admin Controls After QA

Decision: Serialize group member-limit checks in the database, restrict group row updates to group owners, and prevent admin self-demotion or last-admin removal.

Reason:
- API-side count checks are not enough under concurrent invite acceptance.
- Member-wide group UPDATE RLS would allow future client code to mutate operational fields.
- Admin dashboards need a lockout guard before real operation.

## [2026-05-03] Couple-Only MVP And Product Memory Docs

Decision: Hide guest and friend-mode entry points for the normal MVP and store living product strategy under `docs/product/`.

Reason:
- The strongest product wedge is a private couple memory and AI date companion, not generic group planning.
- Guest localStorage undermines the promise of persistent shared couple data.
- Product, monetization, marketing, and UX decisions need a durable home separate from execution handoffs.

## [2026-05-03] Use Group-Scoped Wishlist Persistence

Decision: Add `group_wishlist` as the canonical logged-in wishlist table instead of forcing the old `wishlist.couple_id` table into the current `groups` model.

Reason:
- Current auth and invite APIs already create `groups` and `group_members`.
- The legacy `wishlist` table points at `couples`, which would create a second relationship model.
- Group-scoped persistence keeps future friend-mode compatibility while the UI stays couple-only.

## [2026-05-04] Review Media Is Private Storage Plus DB Metadata

Decision: Store image/video binaries in the private `review-media` Supabase Storage bucket and store only paths and metadata in Postgres.

Reason:
- Large media does not belong in Postgres rows.
- A private bucket plus signed URL/API mediation preserves the public/private split.
- Public reviews can expose media intentionally, while private couple media remains group-scoped.

## [2026-05-04] Advanced Couple AI Requires Editable Memory

Decision: Gift recommendations, conflict support, and partner profile summaries are product-aligned only if built on opt-in, editable couple memory.

Reason:
- These features strengthen the core "AI that remembers your couple" value proposition.
- They become risky if the app silently judges personality, diagnoses users, or stores hidden inferences.
