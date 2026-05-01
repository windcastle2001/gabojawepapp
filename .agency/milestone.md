# DateMate — 8주 상세 마일스톤 (v2)

**작성자:** 전마크 부장 (Planner)
**기준 버전:** PRD v1.2
**작성일:** 2026-04-18
**현재 상태:** P0 진행 중

---

## 의존성 그래프

```
[P0: Setup] → [P1: Capture]
                    ↓
              [P2: RAG+Share]
                    ↓
              [P3: Public]
                    ↓
              [P4: Admin]
                    ↓
              [P5: Polish]
                    ↓
              [P6: Launch]

병렬 가능 구간:
- P0 내: db-master(스키마) + back-expert(Next.js 골격) + designer(디자인 시스템) 병렬
- P1 내: ai-specialist(파싱 프롬프트) + back-expert(어댑터 구현) + designer(인박스 UI) 병렬
- P3 내: designer(맵 UI) + growth-lead(블로그 콘텐츠) 병렬
- P5 내: qa-auditor(RLS 감사) + back-expert(성능 최적화) + designer(이별 모드 UX) 병렬
- P6 내: growth-lead(AdSense 패키지) + qa-auditor(최종 감사) 병렬
```

---

## 마일스톤 상세

| Phase | 기간 | 목표 | 산출물 | 담당 에이전트 | 병렬 가능 | 리스크 레벨 |
|---|---|---|---|---|---|---|
| P0: Setup | Week 1 | 프로젝트 골격 완성 — 이후 모든 Phase의 공통 인프라 확보 | Next.js App Router 스캐폴딩, schema.sql(RLS 포함 Critical 수정 반영), Supabase Auth(OTP+카카오OAuth), .env.example, ARCHITECTURE.md, Tailwind+Shadcn/UI 토큰 | back-expert, db-master, designer | db-master(스키마) + back-expert(Next.js 설정) + designer(디자인 토큰) 병렬 | High |
| P1: Capture | Week 2-3 | 핵심 킬러 플로우 구현 — 카톡 공유 시트 1탭 저장 완성 | 홈 적재 인박스 UI, Gemini 파싱 파이프라인, Wishlist CRUD API(/api/wishlist), PWA manifest + share_target 핸들러, 링크 어댑터 6종(카카오맵/네이버지도/구글지도/네이버블로그/유튜브/인스타그램), Capture_Cache 24h TTL, 카드 Preview UI(2초 이내) | front-coder, back-expert, ai-specialist, db-master | ai-specialist(파싱 프롬프트) + back-expert(어댑터) + designer(인박스 UI 설계) 병렬 | High |
| P2: RAG+Share | Week 4 | AI 추천 루프 + 카톡 부메랑 완성 | 3단계 RAG 엔진(위시리스트 2건 + 커뮤니티 1건 조합), "오늘 뭐할까?" 버튼 UX, /api/recommend 엔드포인트, Intent Classifier 프롬프트, 카톡 내보내기(Web Share API), Guardrail 프롬프트 | ai-specialist, front-coder, designer | ai-specialist(RAG 엔진) + front-coder(공유 UI) + designer(추천 카드 UI) 병렬 | High |
| P3: Public | Week 5 | 커뮤니티 콘텐츠 공개 — 신규 유저 유입 채널 확보 | 공용 맵 페이지(Kakao Maps SDK), 가이드 블로그 10건 이상, SEO 메타태그 + sitemap.xml + robots.txt, OG 이미지, 개인정보처리방침·이용약관 페이지 | designer, front-coder, growth-lead | designer(맵 UI) + growth-lead(블로그 콘텐츠 + 정책 페이지) 병렬 | Med |
| P4: Admin | Week 6 | 운영 통제권 확보 — 데이터 품질·AI 비용 관리 | Admin 대시보드(Supabase Studio 연동), 어댑터 도메인별 성공률 모니터링 패널, Gemini 비용 계측 및 Rate Limit 검증, 프롬프트 버전 관리 체계 | back-expert, ai-specialist, qa-auditor | back-expert(대시보드 구현) + ai-specialist(프롬프트 튜닝) 병렬 | Med |
| P5: Polish | Week 7 | 보안 강화 + 사용자 보호 + 성능 최적화 | 이별 모드 UX(파트너 데이터 분리 + 개인 Export JSON/CSV), RLS 전체 감사 보고서(이슈 0건 목표), Lighthouse 90+ 달성, Core Web Vitals 기준 충족, Prompt Injection 방어 재검증 보고서 | qa-auditor, back-expert, designer, front-coder | qa-auditor(RLS·보안 감사) + back-expert(성능 최적화) + designer(이별 모드 UX) 병렬 | High |
| P6: Launch | Week 8 | 프로덕션 배포 + 수익화 채널 개설 | Vercel 프로덕션 배포 + 시크릿 관리, AdSense 신청 패키지(콘텐츠 10건 + 정책 페이지), 쿠팡 파트너스 연동, Sentry 모니터링 연동, 런치 체크리스트 완료 서명 | back-expert, front-coder, growth-lead, qa-auditor | growth-lead(AdSense 패키지 준비) + qa-auditor(최종 런칭 감사) 병렬 | Med |

---

## Phase별 선행 조건

| Phase | 선행 조건 (Gate) |
|---|---|
| P0: Setup | 없음 — 즉시 착수 가능. 단, schema.sql Critical 수정은 P0 완료 조건에 포함 |
| P1: Capture | P0 완료 확인: schema.sql Critical 이슈 0건, Auth 동작 확인, Next.js 빌드 통과, 디렉터 UI 컨셉 승인 |
| P2: RAG+Share | P1 완료 확인: Wishlist 데이터 실 적재 가능, Gemini 파싱 수락률 75% 이상, 어댑터 6종 유닛 테스트 통과 |
| P3: Public | P1 완료(공용 맵 데이터 소스 존재). P2와 병렬 착수 가능하나 RAG 완성 후 통합 권장 |
| P4: Admin | P2 완료 — AI 추천 파이프라인 실 운영 데이터 필요 |
| P5: Polish | P4 완료 — Admin에서 식별된 이슈 반영 대상 확정 후 착수 |
| P6: Launch | P5 완료 — QA 감사 보고서 Critical/High 이슈 0건, Lighthouse 90+ 달성 |

---

## 리스크 레지스터

| ID | 리스크 | 가능성 | 영향 | 담당 에이전트 | 조기 감지 신호 | 완화 방안 |
|---|---|---|---|---|---|---|
| R-01 | Gemini API 비용 폭증 | Med | High | ai-specialist, back-expert | 일간 API 호출 수 전주 대비 30% 이상 증가 / 월 비용 $50 초과 경보 발생 | Flash 모델 우선 사용(Pro 대비 약 10배 저렴), 프롬프트 캐싱 적용, Capture_Cache 24h TTL로 중복 호출 차단, 사용자별 일 50건 Rate Limit 하드코딩, P4 Admin에서 도메인별 비용 계측 패널 구축 |
| R-02 | 외부 플랫폼 HTML 구조 변경으로 어댑터 파손 | Med | Med | back-expert, ai-specialist | 어댑터 도메인별 파싱 성공률 7일 이동평균 80% 미만으로 하락 알림 | 셀렉터 직접 의존 대신 Gemini JSON 강제 출력 전략 채택(HTML 전달 후 구조화 필드 추출), P4 Admin에 도메인별 성공률 실시간 모니터링 패널 구축, 어댑터 실패 시 "직접 입력" 폴백 UX 즉시 노출 |
| R-03 | 스크래핑 ToS·저작권 이슈 | Low | Med | back-expert, qa-auditor | 외부 플랫폼 이용약관 변경 공지 또는 HTTP 429/403 급증(임계값: 일 10건 이상) | 유저 트리거 단건 fetch만 허용(배치 크롤링 코드 금지), robots.txt 존중 미들웨어 삽입, 본문 원문 미저장(장소명·주소·카테고리 구조화 필드만 DB 보관), P5 QA 감사에 법적 검토 체크리스트 포함 |
| R-04 | 커플 이별 시 데이터 분쟁 | Low | Med | designer, back-expert, qa-auditor | CS 문의 중 데이터 소유권 관련 건수 증가 또는 이별 모드 진입 유저 비율 급증 | P5에서 이별 모드 UX 구현(파트너 데이터 즉시 분리 + 개인 Export JSON/CSV 1탭 제공), 이용약관에 데이터 소유권 조항 명시(P3), 파트너 연동 해제 시 Supabase RLS 정책 자동 전환 로직 구현 |
| R-05 | AdSense 반려 (부족한 콘텐츠) | Med | Med | growth-lead, front-coder | P3 종료 시점에 가이드 블로그 게시 건수 10건 미만 또는 pageview 데이터 부재 | P3에서 가이드 블로그 10건 이상을 Phase 완료 Gate 조건으로 설정, SEO 메타태그·sitemap.xml 완비, 개인정보처리방침·이용약관 P3 완료 전 작성 필수, 반려 시 카카오 애드핏 대체 신청 |
| R-06 | Prompt Injection으로 DB 조작 | Low | High | ai-specialist, back-expert, qa-auditor | QA 침투 테스트에서 비정상 Function Calling 파라미터 실행 감지 또는 예외 쿼리 패턴 로그 등장 | Function Calling 파라미터 서버측 재검증 로직 필수 구현(클라이언트 입력값 신뢰 금지), 허용 함수 화이트리스트 관리, Gemini 응답 Zod 스키마 엄격 검증, P5 QA 감사에 인젝션 시나리오 10건 이상 포함 |
| R-07 | 경쟁사 등장 (카카오/네이버 자체 서비스화) | Low | Med | growth-lead, planner | 카카오/네이버 유사 기능 발표 뉴스 또는 베타 출시 공지 포착 | 커플 Private 위시리스트 데이터 락인 조기 구축(연동 기록·기념일·히스토리 누적), 이별 모드 Export 기능으로 역설적 신뢰 확보, P3 커뮤니티 맵으로 플랫폼 고착화 가속 |
| R-08 | schema.sql Critical 보안 취약점 미수정 상태로 P1 착수 | High | High | db-master, qa-auditor | P0 종료 시 qa-auditor 재검증 결과 Critical 항목 잔존 | P1 착수 전 db-master 수정 완료 + qa-auditor 재검증 통과를 Gate 조건으로 명시, pending_approvals에 등록 후 디렉터 승인 필수 |

---

## 승인 필요 항목

1. **UI 디자인 컨셉 승인**: P1 착수 전 배유나 차장(designer) 브리핑 및 디렉터 컨셉 확인 필요. 권장: P0 Week 1 중 병행 착수.
2. **schema.sql Critical 수정 완료 확인**: db-master 수정 후 qa-auditor 재검증 완료 — P1 Gate 조건.
3. **Gemini 모델 티어 선택**: Flash vs Pro 혼용 전략 비용 시뮬레이션 — ai-specialist 검토 후 P1 착수 전 확정.

---

*파일 경로: `.agency/milestone.md`*
*최종 수정: 2026-04-18 — 전마크 부장*
