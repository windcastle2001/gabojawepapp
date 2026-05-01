# DateMate 프로젝트 문서 인덱스

**마지막 업데이트**: 2026-04-19 | **현재 상태**: Prototype QA 중

---

## 🎯 Quick Start (5초 내 필요한 정보 찾기)

### 내가 지금 뭘 해야 하나?
→ **[현재 블로커](#현재-블로커-critical)** 참고

### 이전에 뭐 했었나?
→ **[최근 타임라인](#최근-타임라인)** 참고

### 이 프로젝트의 결정사항은?
→ **[아키텍처 결정](#아키텍처-결정)** 참고

---

## 📁 파일 구조 & 내용

### `.agency/` 디렉토리

| 파일 | 용도 | 읽어야 할 때 |
|------|------|----------|
| **state.json** | 현재 프로젝트 상태 + 블로커 | 에이전트 시작 시 (필수) |
| **decision_log.md** | 아키텍처 결정 & 이유 | 설계 결정이 필요할 때 |
| **handoff.json** | 이전 에이전트 산출물 & 인수사항 | 현재 할 일 확인할 때 |
| **INDEX.md** | 이 파일 (문서 지도) | 찾고 싶은 게 있을 때 |

### 프로젝트 루트 문서

| 파일 | 용도 | 언제 읽나 |
|------|------|---------|
| CLAUDE.md | 전역 에이전트 설정 + 운영 원칙 | 프로젝트 시작 시 (필수) |
| README.md | 프로젝트 개요 | 처음 참여자 |
| PRD.md | 제품 요구사항 | 기능 이해 필요할 때 |

### 에이전트 역할 명세

| 에이전트 | 파일 | 언제 읽나 |
|---------|------|---------|
| Front-Coder | `~/.claude/agents/front-coder.md` | 프론트 작업 시작 |
| Back-Expert | `~/.claude/agents/back-expert.md` | 백엔드 작업 시작 |
| DB-Master | `~/.claude/agents/db-master.md` | 스키마 작업 시작 |
| AI-Specialist | `~/.claude/agents/ai-specialist.md` | AI 파이프라인 작업 |
| QA-Auditor | `~/.claude/agents/qa-auditor.md` | QA 감사 시작 |

---

## 🚨 현재 블로커 (Critical)

### C-1: TypeScript 빌드 오류 묵살
- **파일**: `next.config.ts:4-5`
- **담당**: Front-Coder (임제이크)
- **상태**: 🔴 Blocking
- **상세**: `.agency/state.json` → `active_blockers[0]` 참고

### C-2: Service Role 키 폴백
- **파일**: `lib/supabase/admin.ts:6`
- **담당**: Back-Expert (조아이반)
- **상태**: 🔴 Blocking
- **상세**: `.agency/state.json` → `active_blockers[1]` 참고

---

## 📅 최근 타임라인

| 날짜 | 담당 | 작업 | 상태 |
|------|------|------|------|
| 2026-04-18 | Front-Coder | 프로토타입 11개 파일 생성 | ✅ 완료 |
| 2026-04-18 | QA-Auditor | 전체 QA 감사 | ✅ 완료 (2개 Critical 발견) |
| 2026-04-19 | Front/Back | Critical 수정 | 🔴 진행 중 |

**전체 타임라인**: `.agency/state.json` → `timeline` 참고

---

## 🏗️ 아키텍처 결정

### 1. 라우트 분리 (Public vs App)
**파일**: `.agency/decision_log.md` → "라우트 구조" 섹션
- 공개 라우트: `app/(public)/`
- 인증 라우트: `app/app/`

### 2. 모델 라우팅 (Gemini vs Claude)
**파일**: `.agency/decision_log.md` → "모델 선택" 섹션
- 코딩: Gemini 3.0 Flash/Pro
- QA: Claude Sonnet 4.6

### 3. 에이전트 일관성 메커니즘
**파일**: `.agency/decision_log.md` → "일관성 메커니즘" 섹션
- 상태 파일: `state.json`
- 결정 로그: `decision_log.md`
- 인수: `handoff.json`

**모든 아키텍처 결정 보기**: `.agency/decision_log.md` 전체 읽기

---

## 🔧 에이전트 시작 체크리스트

**각 에이전트는 이 순서대로:**

```
1️⃣  .agency/state.json 읽기
2️⃣  .agency/decision_log.md 읽기
3️⃣  .agency/handoff.json 읽기
4️⃣  자신의 에이전트 MD 읽기
5️⃣  시작
```

---

## 📊 토큰 & 시간 통계

| 에이전트 | 작업 | 토큰 | 시간 | 누적 |
|---------|------|------|------|------|
| Front-Coder | 프로토타입 | 28,942 | 145.2s | 28,942 |
| QA-Auditor | QA 감사 | 53,184 | 197.7s | 82,126 |

**누적**: 82,126 tokens | 342.9 seconds (5.7분)

---

## 💡 자주 찾는 것들

### Q: 다음 에이전트가 뭐야?
→ `.agency/handoff.json` → `next_steps[0]` 확인

### Q: 이전에 왜 이렇게 했어?
→ `.agency/decision_log.md` 에서 검색

### Q: Critical은 뭐야?
→ `.agency/state.json` → `active_blockers` 참고

### Q: Warning 목록은?
→ `.agency/handoff.json` → `warning_issues` 참고

### Q: 아, 근데 그 이 파일 어디 있었더라?
→ 위의 "파일 구조 & 내용" 표 참고

---

## 🎓 에이전트별 필독 문서

### Front-Coder (임제이크)
1. CLAUDE.md (전역 설정)
2. `.agency/state.json` (현재 상태)
3. `.agency/decision_log.md` (라우트/모델 결정)
4. `~/.claude/agents/front-coder.md` (역할)
5. `.agency/handoff.json` (인수사항)

### Back-Expert (조아이반)
1. CLAUDE.md
2. `.agency/state.json`
3. `.agency/decision_log.md` (모델/보안 결정)
4. `~/.claude/agents/back-expert.md`
5. `.agency/handoff.json`

### QA-Auditor (강샘)
1. CLAUDE.md
2. `.agency/state.json`
3. `.agency/decision_log.md` (일관성 메커니즘)
4. `~/.claude/agents/qa-auditor.md`
5. `.agency/handoff.json` (검수 대상)

---

**마지막 업데이트**: 2026-04-19 | **다음 업데이트**: 에이전트가 작업 완료할 때마다 state.json/handoff.json 갱신
