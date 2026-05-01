# Decision Log

## [2026-04-18] Public vs App route split

Decision: Keep public entry paths and authenticated app paths separated under `app/(public)` and `app/app`.

Reason:
- Public map and landing-style pages should stay reachable without auth.
- App workflows can stay gated without complicating every page.

## [2026-05-01] Couple mode + friends mode share one community map

Decision: Keep a single shared community map and distinguish reviews by `커플 리뷰` vs `친구 리뷰`.

Reason:
- A unified map fills faster and feels alive earlier.
- Filtering by review type is enough for the user experience at prototype stage.

## [2026-05-01] Kakao Maps chosen as primary map engine

Decision: Use Kakao Maps as the primary map engine, but keep a fallback map path so the prototype still works when Kakao is misconfigured.

Reason:
- Korean place UX matters most for this product.
- The prototype needs to stay explorable even before all external console settings are perfect.

## [2026-05-01] Wishlist completion should optionally publish to the community map immediately

Decision: Move community-share intent into the wishlist completion popup instead of forcing a second action from the completed card.

Reason:
- The original flow added friction after users had already finished the core action.
- Sharing at completion time better matches how people naturally leave a short review right after finishing a place.

## [2026-05-01] Community map needs multiple intake paths

Decision: Add four intake paths to the community map flow:
- current-location `내 주변` filter
- manual `제보하기` modal
- Kakao place search results
- Naver/Kakao shared-link registration entry

Reason:
- Buttons that only look clickable break trust fast.
- The product becomes much more convincing when users can add places from search, from links, and from manual memory without changing screens.

## [2026-05-01] Prototype store tracks source metadata explicitly

Decision: Extend local prototype data with `sourceType`, `sourceLabel`, and `sourceUrl` for wishlist items and community places.

Reason:
- Users need to see whether an item came from the community map, a search result, a shared link, or direct manual input.
- That metadata is also what lets map/search/link flows converge cleanly into one wishlist UI.
