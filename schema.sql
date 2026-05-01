-- ============================================================
-- DateMate · Supabase PostgreSQL Schema
-- 작성자  : DB-Master 오하나 수석
-- 기준    : PRD v1.2 + 친구 그룹 모드 변경
-- 생성일  : 2026-04-18
-- 최종수정 : 2026-05-01 (groups/group_members/community_reviews 추가)
-- 실행환경: Supabase SQL Editor (PostgreSQL 15+)
-- ============================================================
-- 실행 순서: Extensions → Function → Tables → Indexes → Triggers → RLS
-- ============================================================


-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() 보조
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- 향후 full-text 검색 대비


-- ============================================================
-- 1. updated_at 자동 갱신 공통 함수
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 테이블명: users | 설명: 서비스 회원 (Supabase Auth 연동)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text        NOT NULL UNIQUE,
  name         text,
  role         text        NOT NULL DEFAULT 'user'
                           CHECK (role IN ('user', 'admin')),
  partner_id   uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users              IS '서비스 회원. Supabase Auth uid와 1:1 매핑.';
COMMENT ON COLUMN public.users.role         IS 'user | admin';
COMMENT ON COLUMN public.users.partner_id   IS '연결된 파트너 user.id (커플 수락 후 설정)';


-- ============================================================
-- 테이블명: couples | 설명: 커플 관계 및 초대 코드 관리
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couples (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id         uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  anniversary      date,
  status           text        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'broken')),
  invite_code      text        NOT NULL,
  invite_expires_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.couples                  IS '커플 관계. invite_code로 파트너 초대.';
COMMENT ON COLUMN public.couples.invite_code      IS '6자리 영숫자 초대 코드';
COMMENT ON COLUMN public.couples.invite_expires_at IS '초대 코드 만료 시각';


-- ============================================================
-- 테이블명: wishlist | 설명: 커플 공유 위시리스트 (장소/콘텐츠)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     uuid        NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  category      text        CHECK (category IN (
                              '음식', '카페', '장소', '선물', '여행', '영상참고', '기타'
                            )),
  title         text        NOT NULL,
  address       text,
  lat           numeric,
  lng           numeric,
  summary       text,
  tags          text[],
  thumbnail_url text,
  source_url    text,
  source_type   text        CHECK (source_type IN (
                              'kakao_map', 'naver_map', 'google_map',
                              'naver_blog', 'youtube', 'instagram', 'manual'
                            )),
  is_completed  boolean     NOT NULL DEFAULT false,
  added_by      uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.wishlist             IS '커플 공유 위시리스트. 카테고리·소스 타입별 장소/콘텐츠 저장.';
COMMENT ON COLUMN public.wishlist.tags        IS '자유 태그 배열';
COMMENT ON COLUMN public.wishlist.source_type IS '콘텐츠 원본 출처 플랫폼';


-- ============================================================
-- 테이블명: public_places | 설명: 유저 기여 공개 장소 DB
-- ============================================================
CREATE TABLE IF NOT EXISTS public.public_places (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text        NOT NULL,
  category       text,
  address        text,
  lat            numeric,
  lng            numeric,
  rating         numeric     CHECK (rating >= 0 AND rating <= 5),
  review_count   integer     NOT NULL DEFAULT 0,
  contributed_by uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.public_places               IS '유저가 기여한 공개 장소 풀. 위시리스트 추천 소스.';
COMMENT ON COLUMN public.public_places.rating        IS '0.0 ~ 5.0';
COMMENT ON COLUMN public.public_places.contributed_by IS '최초 등록 유저';


-- ============================================================
-- 테이블명: groups | 설명: 커플/친구 그룹 (group_type 기반 다형 설계)
-- 의존성: users
-- [결정] couples 테이블과 병렬 유지 — 기존 couple 기능 무중단 보장
-- [이유] couples FK를 참조하는 wishlist 등 기존 테이블의 마이그레이션 비용 최소화
-- [영향] 신규 기능은 groups/group_members 기반으로 구현, 기존 커플 기능은 couples 유지
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  group_type        text        NOT NULL DEFAULT 'couple'
                                CHECK (group_type IN ('couple', 'friends')),
  max_members       integer     NOT NULL DEFAULT 2
                                CHECK (max_members BETWEEN 1 AND 10),
  invite_code       text        NOT NULL,
  invite_expires_at timestamptz,
  created_by        uuid        NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.groups                   IS '커플·친구 그룹. group_type으로 couple/friends 구분.';
COMMENT ON COLUMN public.groups.group_type        IS 'couple | friends';
COMMENT ON COLUMN public.groups.max_members       IS 'couple=2, friends=최대 10';
COMMENT ON COLUMN public.groups.invite_code       IS '초대 코드 (6자리 영숫자)';
COMMENT ON COLUMN public.groups.invite_expires_at IS '초대 코드 만료 시각';


-- ============================================================
-- 테이블명: group_members | 설명: 그룹 멤버십 (그룹-유저 N:M)
-- 의존성: groups, users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  uuid        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      text        NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_members_group_user UNIQUE (group_id, user_id)
);

COMMENT ON TABLE  public.group_members        IS '그룹 멤버십 테이블. owner는 그룹당 1명.';
COMMENT ON COLUMN public.group_members.role   IS 'owner(그룹장) | member(일반)';


-- ============================================================
-- 테이블명: community_reviews | 설명: 장소 커뮤니티 리뷰 (커플/친구 타입 구분)
-- 의존성: public_places, groups, users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.community_reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    uuid        NOT NULL REFERENCES public.public_places(id) ON DELETE CASCADE,
  group_id    uuid        REFERENCES public.groups(id) ON DELETE SET NULL,
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_type text        NOT NULL DEFAULT 'couple'
                          CHECK (review_type IN ('couple', 'friends')),
  rating      numeric     CHECK (rating >= 1 AND rating <= 5),
  content     text,
  image_urls  text[],
  is_public   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.community_reviews              IS '장소 커뮤니티 리뷰. review_type으로 맵 필터링 지원.';
COMMENT ON COLUMN public.community_reviews.review_type IS 'couple | friends (맵 필터 기준)';
COMMENT ON COLUMN public.community_reviews.group_id    IS '작성 그룹 (NULL 허용 — 개인 리뷰 가능)';
COMMENT ON COLUMN public.community_reviews.image_urls  IS '리뷰 이미지 URL 배열 (Storage 경로)';


-- ============================================================
-- 테이블명: system_configs | 설명: 시스템 설정 키-값 저장소
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_configs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   text        NOT NULL UNIQUE,
  config_value text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_configs IS 'admin 전용 시스템 설정. feature flag, 외부 API 키 등.';


-- ============================================================
-- 테이블명: capture_logs | 설명: URL 캡처 요청 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capture_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_type text,
  source_url  text,
  success     boolean     NOT NULL DEFAULT false,
  error_msg   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.capture_logs IS '유저별 URL 캡처 요청 성공/실패 이력. 디버깅·어뷰징 감지용.';


-- ============================================================
-- 테이블명: capture_cache | 설명: URL 파싱 결과 캐시
-- ============================================================
CREATE TABLE IF NOT EXISTS public.capture_cache (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash   text        NOT NULL UNIQUE,
  payload    jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.capture_cache          IS 'URL 파싱 결과 단기 캐시. expires_at 기준 주기적 정리.';
COMMENT ON COLUMN public.capture_cache.url_hash IS 'SHA-256(url) hex 문자열';


-- ============================================================
-- 2. 인덱스
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_partner_id
  ON public.users(partner_id);

-- couples
CREATE UNIQUE INDEX IF NOT EXISTS uidx_couples_invite_code
  ON public.couples(invite_code);

CREATE INDEX IF NOT EXISTS idx_couples_user1_id
  ON public.couples(user1_id);

CREATE INDEX IF NOT EXISTS idx_couples_user2_id
  ON public.couples(user2_id);

-- wishlist (핵심 복합 인덱스: 완료 필터링)
CREATE INDEX IF NOT EXISTS idx_wishlist_couple_completed
  ON public.wishlist(couple_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_wishlist_added_by
  ON public.wishlist(added_by);

-- public_places
CREATE INDEX IF NOT EXISTS idx_public_places_category
  ON public.public_places(category);

-- capture_cache (만료 정리 배치용)
CREATE INDEX IF NOT EXISTS idx_capture_cache_expires_at
  ON public.capture_cache(expires_at);

-- capture_logs
CREATE INDEX IF NOT EXISTS idx_capture_logs_user_id
  ON public.capture_logs(user_id);

-- groups
CREATE UNIQUE INDEX IF NOT EXISTS uidx_groups_invite_code
  ON public.groups(invite_code);

CREATE INDEX IF NOT EXISTS idx_groups_created_by
  ON public.groups(created_by);

CREATE INDEX IF NOT EXISTS idx_groups_group_type
  ON public.groups(group_type);

-- group_members (핵심 쿼리: 유저 소속 그룹 목록)
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id
  ON public.group_members(group_id);

-- community_reviews
CREATE INDEX IF NOT EXISTS idx_community_reviews_place_id
  ON public.community_reviews(place_id);

CREATE INDEX IF NOT EXISTS idx_community_reviews_user_id
  ON public.community_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_community_reviews_group_id
  ON public.community_reviews(group_id);

-- [결정] review_type + place_id 복합 인덱스로 맵 필터링 최적화
-- [이유] 지도 화면에서 "커플 리뷰만 보기" / "친구 리뷰만 보기" 쿼리가 핵심 접근 패턴
CREATE INDEX IF NOT EXISTS idx_community_reviews_place_type
  ON public.community_reviews(place_id, review_type)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_community_reviews_created_at
  ON public.community_reviews(created_at DESC);


-- ============================================================
-- 3. updated_at 트리거 연결
--    (updated_at 컬럼이 있는 테이블에만 적용)
-- ============================================================

-- users
CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- wishlist
CREATE OR REPLACE TRIGGER trg_wishlist_updated_at
  BEFORE UPDATE ON public.wishlist
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- system_configs
CREATE OR REPLACE TRIGGER trg_system_configs_updated_at
  BEFORE UPDATE ON public.system_configs
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- groups
CREATE OR REPLACE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- community_reviews
CREATE OR REPLACE TRIGGER trg_community_reviews_updated_at
  BEFORE UPDATE ON public.community_reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


-- ============================================================
-- 3-A. 그룹 멤버 수 제한 트리거
--   couple: max 2명 / friends: max 10명
--   [결정] CHECK 제약이 아닌 트리거로 구현
--   [이유] max_members 값이 groups 테이블에 있어 크로스 테이블 CHECK 제약 불가
--          (PostgreSQL CHECK는 단일 행 값만 참조 가능)
--   [영향] 멤버 추가 API(back-expert)는 EXCEPTION 메시지를 클라이언트에 전달해야 함
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_check_group_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_current_count integer;
  v_max_members   integer;
  v_group_type    text;
BEGIN
  -- 해당 그룹의 현재 멤버 수 및 제한값 조회
  SELECT g.max_members, g.group_type
  INTO   v_max_members, v_group_type
  FROM   public.groups g
  WHERE  g.id = NEW.group_id;

  SELECT COUNT(*)
  INTO   v_current_count
  FROM   public.group_members gm
  WHERE  gm.group_id = NEW.group_id;

  IF v_current_count >= v_max_members THEN
    RAISE EXCEPTION
      'Group member limit reached. group_type=%, max_members=%, current=%',
      v_group_type, v_max_members, v_current_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_check_group_member_limit IS
  '그룹 멤버 INSERT 전 max_members 초과 여부 검사. couple=2, friends=10.';

CREATE OR REPLACE TRIGGER trg_group_member_limit
  BEFORE INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_group_member_limit();


-- ============================================================
-- 4. Row Level Security 활성화
-- ============================================================
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_places   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reviews ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS 정책 — 헬퍼 함수
--    반복 사용되는 커플 소속 확인을 함수로 캡슐화
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_my_couple_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id
  FROM   public.couples
  WHERE  user1_id = auth.uid()
     OR  user2_id = auth.uid();
$$;

COMMENT ON FUNCTION public.fn_my_couple_ids IS
  '현재 로그인 유저가 속한 couple.id 목록 반환. RLS 정책에서 재사용.';


-- ============================================================
-- 5-A. RLS 정책 — users
--   SELECT : 본인 또는 파트너(partner_id 쌍방)
--   INSERT : Supabase Auth 트리거가 생성하므로 서비스 role 처리
--   UPDATE : 본인 row만
--   DELETE : 비허용 (탈퇴는 별도 절차)
-- ============================================================
DROP POLICY IF EXISTS "users_select_self_or_partner" ON public.users;
CREATE POLICY "users_select_self_or_partner"
  ON public.users
  FOR SELECT
  USING (
    id = auth.uid()
    OR id = (
      SELECT partner_id FROM public.users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self"
  ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- [결정] role 컬럼은 일반 사용자 직접 변경 불가 — service_role(서버)만 변경 가능
-- [이유] 일반 유저가 role='admin'으로 자가 승격하는 권한 상승 공격 차단
-- [영향] back-expert가 supabaseAdmin 클라이언트로 role 변경 처리 필요
REVOKE UPDATE (role) ON public.users FROM authenticated;
GRANT UPDATE (role) ON public.users TO service_role;


-- ============================================================
-- 5-B. RLS 정책 — couples
--   본인이 user1_id 또는 user2_id인 row만 전체 접근
--   INSERT: user1_id = auth.uid() 강제 (본인이 생성한 커플만)
-- ============================================================
DROP POLICY IF EXISTS "couples_access_own" ON public.couples;
CREATE POLICY "couples_access_own"
  ON public.couples
  FOR SELECT
  USING (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
  );

DROP POLICY IF EXISTS "couples_insert_self" ON public.couples;
CREATE POLICY "couples_insert_self"
  ON public.couples
  FOR INSERT
  WITH CHECK (user1_id = auth.uid());

-- [결정] couples UPDATE는 양측 모두 허용하되, invite_code 수정은 애플리케이션 레이어에서 user1_id 전용으로 제한
-- [이유] DB 정책으로 특정 컬럼 UPDATE만 제한하려면 컬럼별 정책이 필요하나 Supabase RLS 미지원
-- [영향] back-expert가 invite_code 갱신 API에서 user1_id 검증 로직 추가 필요
DROP POLICY IF EXISTS "couples_update_own" ON public.couples;
CREATE POLICY "couples_update_own"
  ON public.couples
  FOR UPDATE
  USING (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
  )
  WITH CHECK (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
  );

DROP POLICY IF EXISTS "couples_delete_own" ON public.couples;
CREATE POLICY "couples_delete_own"
  ON public.couples
  FOR DELETE
  USING (user1_id = auth.uid());


-- ============================================================
-- 5-C. RLS 정책 — wishlist
--   couple_id가 본인 커플인 row만 CRUD
--   INSERT 시 added_by = auth.uid() 강제
-- ============================================================
DROP POLICY IF EXISTS "wishlist_select_own_couple" ON public.wishlist;
CREATE POLICY "wishlist_select_own_couple"
  ON public.wishlist
  FOR SELECT
  USING (couple_id IN (SELECT public.fn_my_couple_ids()));

DROP POLICY IF EXISTS "wishlist_insert_own_couple" ON public.wishlist;
CREATE POLICY "wishlist_insert_own_couple"
  ON public.wishlist
  FOR INSERT
  WITH CHECK (
    couple_id IN (SELECT public.fn_my_couple_ids())
    AND added_by = auth.uid()
  );

DROP POLICY IF EXISTS "wishlist_update_own_couple" ON public.wishlist;
CREATE POLICY "wishlist_update_own_couple"
  ON public.wishlist
  FOR UPDATE
  USING (couple_id IN (SELECT public.fn_my_couple_ids()))
  WITH CHECK (couple_id IN (SELECT public.fn_my_couple_ids()));

DROP POLICY IF EXISTS "wishlist_delete_own_couple" ON public.wishlist;
CREATE POLICY "wishlist_delete_own_couple"
  ON public.wishlist
  FOR DELETE
  USING (couple_id IN (SELECT public.fn_my_couple_ids()));


-- ============================================================
-- 5-D. RLS 정책 — public_places
--   SELECT : 모든 인증 유저
--   INSERT : 인증 유저, contributed_by = auth.uid() 강제
--   UPDATE : 본인이 기여한 row만
--   DELETE : 비허용 (관리자 직접 처리)
-- ============================================================
DROP POLICY IF EXISTS "public_places_select_all" ON public.public_places;
CREATE POLICY "public_places_select_all"
  ON public.public_places
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "public_places_insert_self" ON public.public_places;
CREATE POLICY "public_places_insert_self"
  ON public.public_places
  FOR INSERT
  WITH CHECK (contributed_by = auth.uid());

DROP POLICY IF EXISTS "public_places_update_self" ON public.public_places;
CREATE POLICY "public_places_update_self"
  ON public.public_places
  FOR UPDATE
  USING (contributed_by = auth.uid())
  WITH CHECK (contributed_by = auth.uid());


-- ============================================================
-- 5-E. RLS 정책 — system_configs
--   admin role인 유저만 전체 접근
--   role 조회는 users 테이블 서브쿼리 (SECURITY DEFINER 불필요)
-- ============================================================
DROP POLICY IF EXISTS "system_configs_admin_only" ON public.system_configs;
CREATE POLICY "system_configs_admin_only"
  ON public.system_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- 5-F. RLS 정책 — capture_logs
--   본인 user_id = auth.uid() row만 접근
-- ============================================================
DROP POLICY IF EXISTS "capture_logs_own" ON public.capture_logs;
CREATE POLICY "capture_logs_own"
  ON public.capture_logs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 5-G. RLS 정책 — capture_cache
--   캐시는 서버 사이드(service_role)가 관리.
--   일반 유저는 만료되지 않은 row READ만 허용 (쓰기는 service_role).
--   INSERT/UPDATE/DELETE는 서비스 role 전용이므로 정책 미부여.
-- ============================================================
DROP POLICY IF EXISTS "capture_cache_read_valid" ON public.capture_cache;
CREATE POLICY "capture_cache_read_valid"
  ON public.capture_cache
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND expires_at > now()
  );

-- 캐시 쓰기는 service_role이 RLS 우회하여 처리.
GRANT INSERT, UPDATE, DELETE ON public.capture_cache TO service_role;


-- ============================================================
-- 5-H. RLS 헬퍼 함수 — groups/group_members 격리
--   SECURITY DEFINER + SET search_path 필수 (search_path 인젝션 차단)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_my_group_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT ARRAY(
    SELECT group_id
    FROM   public.group_members
    WHERE  user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.fn_my_group_ids IS
  '현재 로그인 유저가 속한 group.id 배열 반환. RLS 정책에서 재사용.';


-- ============================================================
-- 5-I. RLS 정책 — groups
--   SELECT/UPDATE: 소속 그룹만
--   INSERT: created_by = auth.uid() 강제
--   DELETE: created_by(owner)만
-- ============================================================
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
CREATE POLICY "groups_select_member"
  ON public.groups
  FOR SELECT
  USING (id = ANY(public.fn_my_group_ids()));

DROP POLICY IF EXISTS "groups_insert_self" ON public.groups;
CREATE POLICY "groups_insert_self"
  ON public.groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "groups_update_member" ON public.groups;
CREATE POLICY "groups_update_member"
  ON public.groups
  FOR UPDATE
  USING (id = ANY(public.fn_my_group_ids()))
  WITH CHECK (id = ANY(public.fn_my_group_ids()));

-- [결정] groups DELETE는 created_by(그룹장)만 허용
-- [이유] 일반 멤버가 그룹 자체를 삭제하는 것은 의도치 않은 데이터 손실 위험
DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner"
  ON public.groups
  FOR DELETE
  USING (created_by = auth.uid());


-- ============================================================
-- 5-J. RLS 정책 — group_members
--   SELECT: 같은 그룹 멤버 조회 허용 (소셜 기능)
--   INSERT: 본인 user_id = auth.uid() 강제 (자기 자신 추가)
--   DELETE: 본인이 탈퇴 OR 그룹장이 강제 탈퇴
-- ============================================================
DROP POLICY IF EXISTS "group_members_select_same_group" ON public.group_members;
CREATE POLICY "group_members_select_same_group"
  ON public.group_members
  FOR SELECT
  USING (group_id = ANY(public.fn_my_group_ids()));

DROP POLICY IF EXISTS "group_members_insert_self" ON public.group_members;
CREATE POLICY "group_members_insert_self"
  ON public.group_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- [결정] 멤버 UPDATE(role 변경 등)는 RLS 레벨에서 금지, 서버 사이드 처리
-- [이유] role='owner' 자가 승격 방지. 그룹장 위임은 back-expert API에서 service_role로 처리
DROP POLICY IF EXISTS "group_members_delete_self_or_owner" ON public.group_members;
CREATE POLICY "group_members_delete_self_or_owner"
  ON public.group_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE  gm2.group_id = group_id
        AND  gm2.user_id  = auth.uid()
        AND  gm2.role     = 'owner'
    )
  );


-- ============================================================
-- 5-K. RLS 정책 — community_reviews
--   SELECT : is_public=true → 모든 인증 유저 (비로그인 차단)
--            is_public=false → 작성자 및 같은 그룹만
--   INSERT : 인증 유저, user_id = auth.uid() 강제
--   UPDATE : 본인 작성 리뷰만
--   DELETE : 본인 작성 리뷰만
-- ============================================================

-- 공개 리뷰: 인증 유저 전체 읽기 (맵 커뮤니티 기능)
DROP POLICY IF EXISTS "community_reviews_select_public" ON public.community_reviews;
CREATE POLICY "community_reviews_select_public"
  ON public.community_reviews
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND is_public = true
  );

-- 비공개 리뷰: 작성자 또는 같은 그룹만 읽기
DROP POLICY IF EXISTS "community_reviews_select_private" ON public.community_reviews;
CREATE POLICY "community_reviews_select_private"
  ON public.community_reviews
  FOR SELECT
  USING (
    is_public = false
    AND (
      user_id = auth.uid()
      OR group_id = ANY(public.fn_my_group_ids())
    )
  );

DROP POLICY IF EXISTS "community_reviews_insert_self" ON public.community_reviews;
CREATE POLICY "community_reviews_insert_self"
  ON public.community_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "community_reviews_update_self" ON public.community_reviews;
CREATE POLICY "community_reviews_update_self"
  ON public.community_reviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "community_reviews_delete_self" ON public.community_reviews;
CREATE POLICY "community_reviews_delete_self"
  ON public.community_reviews
  FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- 6. 만료 캐시 정리 함수 (pg_cron 또는 Edge Function에서 호출)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_purge_expired_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.capture_cache
  WHERE expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.fn_purge_expired_cache IS
  '만료된 capture_cache row 삭제. pg_cron 스케줄 또는 Edge Function에서 주기적으로 호출.';


-- ============================================================
-- END OF SCHEMA
-- ============================================================
