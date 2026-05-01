// Supabase JS v2.45+ / PostgREST v12 호환 Database 타입
// @supabase/postgrest-js 2.103.x GenericSchema 충족 조건:
//   - Tables: Record<string, GenericTable>
//   - Views: Record<string, GenericView>  (never 금지 — GenericView 바운드 미충족)
//   - Functions: Record<string, GenericFunction>
// GenericTable 충족 조건: Row, Insert, Update, Relationships 필수

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'user' | 'admin';
          partner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: 'user' | 'admin';
          partner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: 'user' | 'admin';
          partner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          anniversary: string | null;
          status: 'active' | 'broken';
          invite_code: string;
          invite_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id?: string | null;
          anniversary?: string | null;
          status?: 'active' | 'broken';
          invite_code: string;
          invite_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string | null;
          anniversary?: string | null;
          status?: 'active' | 'broken';
          invite_code?: string;
          invite_expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      wishlist: {
        Row: {
          id: string;
          couple_id: string;
          category: '음식' | '카페' | '장소' | '선물' | '여행' | '영상참고' | '기타' | null;
          title: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          summary: string | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          source_url: string | null;
          source_type:
            | 'kakao_map'
            | 'naver_map'
            | 'google_map'
            | 'naver_blog'
            | 'youtube'
            | 'instagram'
            | 'manual'
            | null;
          is_completed: boolean;
          added_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          category?: '음식' | '카페' | '장소' | '선물' | '여행' | '영상참고' | '기타' | null;
          title: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          summary?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          source_url?: string | null;
          source_type?:
            | 'kakao_map'
            | 'naver_map'
            | 'google_map'
            | 'naver_blog'
            | 'youtube'
            | 'instagram'
            | 'manual'
            | null;
          is_completed?: boolean;
          added_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          category?: '음식' | '카페' | '장소' | '선물' | '여행' | '영상참고' | '기타' | null;
          title?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          summary?: string | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          source_url?: string | null;
          source_type?:
            | 'kakao_map'
            | 'naver_map'
            | 'google_map'
            | 'naver_blog'
            | 'youtube'
            | 'instagram'
            | 'manual'
            | null;
          is_completed?: boolean;
          added_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      public_places: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          rating: number | null;
          review_count: number;
          contributed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          review_count?: number;
          contributed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          rating?: number | null;
          review_count?: number;
          contributed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      system_configs: {
        Row: {
          id: string;
          config_key: string;
          config_value: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          config_key: string;
          config_value?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          config_key?: string;
          config_value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      capture_logs: {
        Row: {
          id: string;
          user_id: string;
          source_type: string | null;
          source_url: string | null;
          success: boolean;
          error_msg: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type?: string | null;
          source_url?: string | null;
          success: boolean;
          error_msg?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: string | null;
          source_url?: string | null;
          success?: boolean;
          error_msg?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      capture_cache: {
        Row: {
          id: string;
          url_hash: string;
          payload: Record<string, unknown> | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          url_hash: string;
          payload?: Record<string, unknown> | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          url_hash?: string;
          payload?: Record<string, unknown> | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<PropertyKey, never>; // 현재 뷰 없음. supabase gen types 실행 시 자동 채워짐
    Functions: {
      fn_my_couple_ids: { Args: Record<never, never>; Returns: string[] };
      fn_purge_expired_cache: { Args: Record<never, never>; Returns: number };
    };
  };
};
