# Gajago Product Strategy

Last updated: 2026-05-03

## Current Positioning

Gajago should be positioned as a couple-only AI date companion, not a generic map or friend-group planning app.

Primary promise:

> A private couple space that remembers your tastes, plans better dates, and turns places, reviews, photos, budgets, and memories into a shared relationship database.

## Product Decisions

- MVP target is couples only.
- Friend mode should be hidden from normal user-facing UI, while the underlying group schema can remain compatible for future expansion.
- Guest mode should be removed from the main path. A couple product is only credible when shared records persist across devices and partners.
- If a demo is needed, it should be a logged-in sample couple space, not mixed with a user's real data.
- Apple login should be added later:
  - Web: show Google and Apple.
  - iOS app: show Apple and Google.
  - Android app: prefer Google, hide Apple unless there is a clear reason.
- Global expansion should not start with separate DBs per country. Start with one backend and design data with country/locale/provider fields.

## MVP Roadmap

1. Move wishlist, completed visits, reviews, and community pins from localStorage to Supabase.
2. Hide friend mode and guest mode from user-facing flows.
3. Add review media: up to 5 images and 1 short video.
4. Add cost/budget fields to visit reviews.
5. Add review recommendations/votes.
6. Add rankings: global, regional, category, and couple-specific best lists.
7. Build a couple memory database for preferences, dislikes, anniversaries, MBTI, zodiac, budgets, and repeated patterns.
8. Improve AI recommendations using the couple memory database.
9. Add i18n and map-provider branching:
   - Korea: Kakao Maps.
   - Other countries: Google Maps.
10. Add fixed review translations at creation time for Korean, English, Japanese, and Traditional Chinese.

## AI Memory Direction

Do not describe the product as "training the AI on private couple chats." The safer and more accurate framing is:

- With user consent, the app builds and updates a private couple memory database.
- The model does not need to be fine-tuned on the couple's data.
- AI answers should retrieve relevant memories and records at request time.
- Users should be able to view, edit, and delete memories.

Examples of couple memories:

- One partner cannot eat fish.
- They prefer quiet cafes.
- They avoid long walking routes.
- Average date budget is around 60,000 KRW.
- Anniversaries and birthdays matter.

## Advanced Couple AI

Advanced AI features are strategically aligned with the couple-only direction, but they must be framed carefully.

Recommended features:

- Gift recommendations based on anniversaries, budget, partner preferences, past reactions, and saved places.
- Conflict support after arguments, focused on reflection, de-escalation, and better wording rather than "who is right."
- Partner profile pages that show editable, consent-based summaries:
  - personality and communication style
  - likes and dislikes
  - gift preferences
  - food restrictions
  - preferred date mood
  - budget comfort zone
  - important dates
- Couple dynamics summary:
  - what usually makes plans succeed
  - common friction points
  - preferred reconciliation style

Strict boundaries:

- Do not make medical, legal, or manipulative psychological claims.
- Do not label a partner with harsh fixed judgments.
- Do not infer sensitive traits without user confirmation.
- Always let users edit or delete AI-generated profile memories.
- Conflict support should encourage direct communication and safety, not emotional manipulation.

## Global Data Model Notes

Plan for:

- `country_code`
- `locale`
- `original_language`
- translated review fields
- `place_provider`
- `provider_place_id`
- map provider by country
- regional ranking keys

Do not split DB regions until there is real traffic, latency pressure, or legal/compliance pressure.
