# DateMate (가자고) PRD (Product Requirements Document)

**문서 버전:** v2.0 (프라이빗 커플 메모리 & AI 데이트 비서 피벗)
**작성일:** 2026-05-03
**변경 이력:**
- v1.0~1.2 (2026-04-18): 카톡 기반 빠른 적재 인박스, 애드센스 수익화 위주 설계.
- v2.0 (2026-05-03): **제품 전략 전면 수정 (`product_strategy.md` 반영)**. 커플 전용 프라이빗 공간으로 피벗. '커플 메모리 DB' 기반의 AI 데이트 플래닝 및 프리미엄 구독 모델 도입. 친구 모임(Friend mode)은 유저 노출에서 숨김 처리. 애드센스 제거.

**프로젝트 코드명:** Gajago (가자고)
**문서 소유자:** Product / Engineering

---

## 1. Executive Summary

### 1.1 제품 한 줄 정의
> **"우리의 취향, 예산, 지난 데이트 추억까지 싹 다 기억하고 맞춤형 코스를 짜주는 우리만의 프라이빗 AI 데이트 비서."**

### 1.2 포지셔닝 원칙 (핵심)
- **프라이빗 커플 공간:** 단순한 맛집 지도나 친구 모임 기획 앱이 아닙니다. 커플만의 은밀하고 소중한 기록(사진, 후기, 비용 등)을 저장하는 닫힌 공간입니다.
- **커플 메모리 DB 기반:** AI가 우리의 취향("해산물 비선호", "조용한 곳 선호"), 데이트 예산, 기념일 등을 기억하여 초개인화된 데이트 코스를 제안합니다.
- **구독 기반 (광고 제거):** 커플의 소중한 공간에 어울리지 않는 배너 광고(애드센스)는 완전히 배제하고, 구독(Subscription) 모델을 핵심 수익화로 가져갑니다.
- **커뮤니티와 랭킹:** 우리가 다녀온 찐 장소를 공유하고, 광고성 블로그 대신 '진짜 커플들이 검증한 데이트 랭킹'을 구축합니다.

### 1.3 핵심 가치 제안 (Value Proposition)
1. **Couple Memory Database:** 데이트 취향, 선호/비선호 사항, 지출 예산, 기념일 등 커플의 연애 데이터를 영속화.
2. **Advanced AI Date Planner:** 단순 장소 나열이 아닌, 날씨/예산/위치/커플 메모리를 종합해 맥락에 맞는 코스 플래닝.
3. **Zero-Friction Capture:** 기존의 카톡/브라우저 공유 시트를 통한 1초 적재(Link Adapter) 유지.
4. **Community Rankings:** 커플들이 공유한 리뷰를 바탕으로 지역별/카테고리별/글로벌 진짜 랭킹 제공.

---

## 2. 배경 및 문제 정의 (Problem Statement)

### 2.1 기존 대체재의 한계
- **지도 앱 (카카오/네이버 맵):** 장소 저장은 쉽지만, "우리가 여기서 무슨 이야기를 했고, 얼마나 썼고, 왜 좋았는지" 같은 커플의 맥락(Context)을 담지 못함.
- **카카오톡 대화방:** 데이트 링크와 후기가 금방 휘발됨.
- **일반 맛집 앱/블로그:** SEO 상위권 광고 리뷰가 점령. "우리 커플의 취향과 예산"을 전혀 모름. 매번 데이트 짤 때마다 제로베이스에서 검색해야 하는 피로감.

**차별점:** 커플의 사적인 '기억(Memory)'을 DB화하고 이를 기반으로 추천하는 유일한 AI 비서.

---

## 3. 범위 및 제약사항 (Scope)

### 3.1 In-Scope (MVP, v2.0)
- **대상:** 오직 커플 (Couple-only).
- **인증:** Google OAuth, 파트너 연동 (초대 코드 기반). (Guest 모드는 실제 유저 사용 흐름에서 제거)
- **적재 (Capture):** 기존 개발된 멀티소스 링크 어댑터를 통한 장소/콘텐츠 스크랩 및 AI 구조화.
- **커플 메모리 DB:** 둘만의 선호도, 알레르기, 평균 데이트 예산, 기념일, MBTI 등을 저장/조회/수정하는 UI.
- **프리미엄 구독 플랜 기능 제어:** 무제한 저장 제한, 미디어 확장(사진 5장, 영상 1개), 고급 AI 추천 제어.
- **AI 코스 제안:** 커플 메모리 + 위시리스트 + 커뮤니티 장소를 조합한 RAG 기반 제안.
- **커뮤니티 & 랭킹:** 완료된 데이트 위시를 리뷰와 함께 공개(Public)로 공유, 유저 추천/투표, 지역별 랭킹 보드.

### 3.2 Out-of-Scope (v2.0 제외)
- 친구 모임 그룹 관리 (기존 스키마는 유지하되 UI에서는 철저히 은닉)
- 애드센스 (광고 전면 제거)
- 별도 앱 출시 (iOS/Android 네이티브는 추후, 현재는 웹/PWA 집중)

---

## 4. 핵심 기능 상세 (Feature Requirements)

### F1. 커플 연동 및 메모리 DB 구축
- **F1.1** Google 로그인 후 파트너 초대 (초대코드) 및 연동.
- **F1.2** **커플 프로필 & 메모리 설정:** 식성(해산물X 등), 선호 데이트 스타일(액티비티/정적인 데이트), 1회 평균 예산, 중요 기념일 설정. (유저가 직접 입력 및 열람/수정/삭제 가능)

### F2. 위시리스트 & 기록 (Capture & Journal)
- **F2.1** 공유 시트 및 링크 복붙을 통한 AI 기반 장소 적재 (멀티소스 어댑터).
- **F2.2** 장소 방문 완료 처리 시: 사진(최대 5장), 짧은 영상(1개), **지출 비용(Cost)**, 별점 및 코멘트 기록.

### F3. 커뮤니티 랭킹 & 큐레이션 (Community)
- **F3.1** 사용자가 리뷰를 남길 때 '커뮤니티에 공개' 옵션 제공.
- **F3.2** 공개된 장소들은 지역별(예: 성수동), 카테고리별(카페/맛집) 커플 베스트 랭킹으로 집계.
- **F3.3** 다른 커플의 랭킹을 탐색하고 내 위시리스트로 바로 담아오기(Fork) 기능.

### F4. AI 데이트 비서 (AI Planner)
- **F4.1** "이번 주말 데이트 짜줘" 요청 시 RAG 실행.
- **F4.2** [검색 컨텍스트 구성]: 1순위 - 커플 메모리(취향/예산/기념일), 2순위 - 위시리스트 미방문 장소, 3순위 - 커뮤니티 랭킹 장소.
- **F4.3** "평소 6만 원 예산에 맞춰 조용한 카페와 맛집을 위시리스트에서 조합해 드릴게요." 형태의 개인화된 답변 제공.

---

## 5. 수익화 및 마케팅 전략 (Monetization & Marketing)

### 5.1 수익화 (Monetization)
- **구독 모델 (Primary):**
  - **Free Plan:** 기본 위시리스트 저장, 기본 AI 추천(월 제한), 미디어 저장 제한.
  - **Premium Plan:** 무제한 저장, 고급 AI 데이트 기획(예산/기념일/취향 완벽 반영), 미디어 확장(사진/영상 추가), 커플 맞춤형 랭킹 열람 등. (예상 가격: 월 2,900~4,900원 / 연 29,000~39,000원. 커플 중 1명 결제 시 양측 적용)
- **제휴 수익 (Secondary):**
  - 추천된 레스토랑 예약 연동 수수료.
  - 꽃, 케이크, 선물, 여행 상품 제휴 링크(Affiliate).
  - 연말 커플 메모리 리포트/포토북 실물 판매.

### 5.2 마케팅 포지셔닝
- "카카오톡은 대화를, '가자고'는 당신의 추억과 취향을 기억합니다."
- "광고에 속지 말고, 진짜 커플들이 검증한 데이트 랭킹을 보세요."

---

## 6. 마일스톤 및 넥스트 스텝

**1단계 (Current): 문서 및 스키마 정렬**
- `PRD.md` 갱신 (본 문서 적용)
- `schema.sql` 갱신 (`couple_memories` 추가, `community_reviews`에 비용/미디어 컬럼 보강)
- 프론트엔드 UI 및 상태에서 '친구 모임/게스트 모드' 은닉 처리.

**2단계: 구독/결제 연동 준비**
- 기능별 Free/Premium 분기 로직 구현
- AI RAG에 `couple_memories` 컨텍스트 주입부 개발

**3단계: 런칭 및 초기 실험**
- 랜딩페이지 오픈 및 대기자 명단 모집
- 숏폼(틱톡/릴스) 커플 채널을 통한 바이럴 마케팅 테스트
---

## 7. 2026-05-04 추가 결정 사항

### 7.1 미디어 저장 원칙
- 리뷰 이미지와 짧은 영상은 DB에 직접 저장하지 않는다.
- 원본 파일은 Supabase Storage의 private bucket에 저장한다.
- DB에는 `review_media.storage_path`, `media_type`, `sort_order`, `review_id` 같은 메타데이터만 저장한다.
- 공개 리뷰(`community_reviews.is_public = true`)에 연결된 미디어만 다른 유저에게 보여준다.
- private 커플 기록이나 공유하지 않은 방문 리뷰의 미디어는 해당 커플/group만 볼 수 있어야 한다.
- 공개 미디어도 public bucket을 기본값으로 두지 않고, signed URL 또는 API 중개 방식으로 노출한다.

### 7.2 공개/비공개 데이터 분리
- 커플 위시, 완료 기록, private 리뷰는 group-scoped private data로 취급한다.
- 커뮤니티 공유를 명시적으로 선택한 경우에만 `public_places` 및 public `community_reviews`로 복사/연결한다.
- 공개 리뷰는 추천/랭킹/지역별 베스트에 사용될 수 있다.
- private 리뷰와 couple memory는 랭킹/공개 추천 데이터에 사용하지 않는다.

### 7.3 고도화 AI 방향
- 선물 추천, 다툼 후 대화/화해 보조, 파트너 성향 프로필은 장기 방향으로 적합하다.
- 단, AI가 사용자를 몰래 평가하거나 진단하는 구조는 금지한다.
- AI가 추출한 성향/취향/상황 메모리는 사용자가 확인, 수정, 삭제할 수 있어야 한다.
- 다툼 상담 기능은 누가 맞는지 판정하는 기능이 아니라 감정 정리, 표현 추천, 안전한 대화 유도 기능으로 제한한다.
- 선물 추천은 기념일, 예산, 저장한 장소, 과거 반응, 취향 메모리를 기반으로 한다.

### 7.4 AI memory implementation guardrails
- `partner_profiles` and `couple_memories` are the canonical user-visible memory tables.
- AI may use only profile/memory items that the user explicitly marks as AI-usable.
- Chat-derived memory must be proposed as a candidate first; it is not saved until a user confirms it.
- Users must be able to edit, archive, or delete memory items before deeper personalization is marketed as a core feature.
- Conflict-support AI should summarize feelings, soften wording, and suggest repair actions. It must not declare a winner, diagnose either person, or assign relationship scores.
