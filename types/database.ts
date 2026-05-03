export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          id?: string;
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
          category: string | null;
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
          category?: string | null;
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
          category?: string | null;
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
      groups: {
        Row: {
          id: string;
          name: string;
          group_type: 'couple' | 'friends';
          max_members: number;
          invite_code: string;
          invite_expires_at: string | null;
          created_by: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          group_type?: 'couple' | 'friends';
          max_members?: number;
          invite_code: string;
          invite_expires_at?: string | null;
          created_by: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          group_type?: 'couple' | 'friends';
          max_members?: number;
          invite_code?: string;
          invite_expires_at?: string | null;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'owner' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: 'owner' | 'member';
          joined_at?: string;
        };
        Relationships: [];
      };
      community_reviews: {
        Row: {
          id: string;
          place_id: string;
          group_id: string | null;
          user_id: string;
          review_type: 'couple' | 'friends';
          rating: number | null;
          content: string | null;
          image_urls: string[] | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          place_id: string;
          group_id?: string | null;
          user_id: string;
          review_type?: 'couple' | 'friends';
          rating?: number | null;
          content?: string | null;
          image_urls?: string[] | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          place_id?: string;
          group_id?: string | null;
          user_id?: string;
          review_type?: 'couple' | 'friends';
          rating?: number | null;
          content?: string | null;
          image_urls?: string[] | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
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
          success?: boolean;
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
          payload: Json | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          url_hash: string;
          payload?: Json | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          url_hash?: string;
          payload?: Json | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fn_check_group_member_limit: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      fn_my_couple_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      fn_my_group_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      fn_purge_expired_cache: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
  };
};
