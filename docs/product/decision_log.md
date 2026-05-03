# Product Decision Log

Last updated: 2026-05-03

## 2026-05-03: Couple-Only MVP

Decision: Hide friend mode from normal user-facing UI and focus the MVP on couples.

Reason: The couple use case has a stronger emotional hook and clearer differentiation through shared memory, date planning, anniversaries, and private preferences. Friend-group planning overlaps heavily with existing chat, map, and social tools.

Implementation note: Keep the underlying `friends` group type compatible for later expansion, but do not expose it in onboarding, filters, or main copy.

## 2026-05-03: Login Required For Real Product

Decision: Remove guest mode from the main product path.

Reason: Guest mode keeps data in localStorage and undermines the core promise of shared, persistent couple records.

Implementation note: If demo is needed, build a logged-in sample couple space with clearly separated demo data.

## 2026-05-03: Subscription First

Decision: Subscription is preferred over ads.

Reason: Ads conflict with the private/intimate feel of a couple space and require large traffic to matter. Couple-level premium aligns better with storage, AI, and personalization costs.

## 2026-05-03: AI Memory As Private Database

Decision: Use a private couple memory database and retrieval, not model fine-tuning on private couple data.

Reason: This is safer, cheaper, more explainable, and gives users control over viewing/editing/deleting memories.

## 2026-05-04: Media Uses Storage, DB Stores Paths

Decision: Store review images/videos in Supabase Storage and store paths/metadata in DB tables.

Reason: Postgres should not hold large binary media. A private Storage bucket with DB metadata gives better privacy, cost control, and signed delivery options.

## 2026-05-04: Advanced Couple AI Is In Scope With Consent

Decision: Gift recommendations, conflict support, and editable partner profiles are a good long-term direction if built from consent-based couple memory.

Reason: These features strengthen the "AI that remembers your couple" positioning. They are risky if framed as psychological diagnosis or hidden surveillance, so every extracted memory must be visible, editable, and deletable.
