## QA 감사 리포트 (2차 재감사) | 2026-04-18 | 대상: schema.sql (DateMate Supabase PostgreSQL)

- **감사일:** 2026-04-18
- **대상:** schema.sql
- **감사자:** 강샘 과장 (QA-Auditor)
- **감사 구분:** 2차 재감사 (db-master 수정 완료 후)

---

### 수정 항목 반영 확인 (5건)

| 항목 | 위치 | 반영 여부 |
|---|---|---|
| C-1-A: fn_my_couple_ids() SET search_path | L249 | 반영 완료 |
| C-1-B: fn_purge_expired_cache() SET search_path | L464 | 반영 완료 |
| C-2: REVOKE UPDATE (role) FROM authenticated | L295 | 반영 완료 |
| C-2: GRANT UPDATE (role) TO service_role | L296 | 반영 완료 |
| W-3: GRANT INSERT,UPDATE,DELETE ON capture_cache TO service_role | L454 | 반영 완료 (주석 해제) |
| W-4: couples_update_own 정책 설계 결정 주석 | L319~321 | 반영 완료 |

---

### 🔴 Critical (0건)

전건 해소 확인.

---

### 🟡 Warning (2건)

**[W-1] invite_code 만료 처리 — DB 레이어 강제 없음**
- 위치: L62~63 (invite_expires_at 컬럼), couples RLS 정책 전체
- 현재 상태: 변경 없음. invite_expires_at 컬럼과 인덱스는 존재하나, 초대 코드 조회/사용 시 `invite_expires_at > now()` 조건을 DB 레이어(RLS 정책 또는 SECURITY DEFINER RPC)에서 강제하는 구조 없음. 앱 레이어 단독 의존 상태.
- 등급 판정: Warning 유지. 앱 레이어 우회 또는 레이스 컨디션 시 만료 코드 재사용 가능. 즉시 악용 가능한 Critical 수준은 아니나 설계 결함으로 배포 전 수정 권장.
- 수정 방안: 초대 코드 검증용 SECURITY DEFINER RPC 함수 내 `invite_expires_at > now()` 조건 강제. 또는 couples SELECT 정책에 초대 코드 기반 조회 경로 제한 추가.

**[W-2] users SELECT 정책 — 파트너 전체 컬럼 노출**
- 위치: L268~277 (users_select_self_or_partner 정책)
- 현재 상태: 변경 없음. 파트너 row 조회 시 email, role, partner_id, created_at 등 전체 컬럼 무제한 노출. role='admin' 여부, 이메일 주소가 파트너에게 노출됨.
- 등급 판정: Warning 유지. C-2 수정(role 컬럼 UPDATE REVOKE)으로 role 자가 승격은 차단됐으나, role 값 자체가 파트너에게 읽히는 정보 노출 문제는 잔존. admin 계정이 커플 연결 시 역할 노출.
- 수정 방안: 파트너 조회 전용 VIEW(name, partner_id 등 최소 컬럼만) 생성 또는 본인 row와 파트너 row를 분리 조회하는 RPC 함수로 컬럼 노출 범위 제한.

---

### 🟢 Pass (파일 기록용)

- [P-1] 모든 public.* 테이블 7개 RLS ENABLE 확인 완료 (L231~237)
- [P-2] wishlist couple_id 격리: fn_my_couple_ids() 서브쿼리로 SELECT/INSERT/UPDATE/DELETE 4개 정책 모두 적용
- [P-3] system_configs: FOR ALL + USING/WITH CHECK 이중 적용. 비인증 접근 시 RLS default-deny 적용
- [P-4] SQL Injection: 동적 쿼리 패턴 없음. 전체 함수 정적 쿼리. Injection 위험 없음
- [P-5] capture_cache READ: expires_at > now() 조건 RLS 정책 레벨 강제 확인
- [P-6] capture_logs: FOR ALL 정책으로 user_id = auth.uid() 강제. 타인 로그 접근 차단
- [P-7] public_places: DELETE 정책 미부여로 default-deny 적용
- [P-8] couples INSERT: user1_id = auth.uid() WITH CHECK 강제
- [P-9] fn_my_couple_ids(): SET search_path = public, pg_catalog 고정 확인 (L249)
- [P-10] fn_purge_expired_cache(): SET search_path = public, pg_catalog 고정 확인 (L464)
- [P-11] role 자가 승격 차단: REVOKE UPDATE (role) FROM authenticated 적용 확인 (L295)
- [P-12] capture_cache 쓰기 권한: GRANT INSERT,UPDATE,DELETE TO service_role 활성화 확인 (L454)

---

### 종합 판정

| 등급 | 1차 감사 | 2차 재감사 |
|---|---|---|
| Critical | 2건 | 0건 (전건 해소) |
| Warning | 4건 | 2건 (W-3, W-4 해소. W-1, W-2 잔존) |

**배포 가능.** Critical 0건. W-1, W-2는 배포 후 다음 스프린트 수정 권장.

---

## [아카이브] 1차 감사 결과 | 2026-04-18

### Critical (2건) — 수정 완료

**[C-1] fn_my_couple_ids() SECURITY DEFINER — search_path 미고정**
- fn_my_couple_ids()(L244~254), fn_purge_expired_cache()(L451~465) 모두 해당
- 수정 완료: SET search_path = public, pg_catalog 추가

**[C-2] users 테이블 — role 컬럼 자가 승격 차단 정책 미비**
- 수정 완료: REVOKE UPDATE (role) FROM authenticated + GRANT TO service_role

### Warning (4건) — W-3, W-4 수정 완료 / W-1, W-2 잔존

**[W-3] capture_cache GRANT 주석 처리 — 수정 완료**
**[W-4] couples_update_own 설계 결정 주석 미비 — 수정 완료**
**[W-1] invite_code 만료 처리 DB 레이어 부재 — 잔존**
**[W-2] users SELECT 파트너 전체 컬럼 노출 — 잔존**
