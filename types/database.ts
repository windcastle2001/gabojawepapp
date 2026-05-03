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
          country_code: string;
          region: string | null;
          locale: string;
          place_provider: string | null;
          provider_place_id: string | null;
          source_url: string | null;
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
          country_code?: string;
          region?: string | null;
          locale?: string;
          place_provider?: string | null;
          provider_place_id?: string | null;
          source_url?: string | null;
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
          country_code?: string;
          region?: string | null;
          locale?: string;
          place_provider?: string | null;
          provider_place_id?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      partner_profiles: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          display_name: string | null;
          birthday: string | null;
          mbti:
            | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
            | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
            | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
            | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
            | null;
          zodiac: string | null;
          personality_summary: string | null;
          gift_preferences: Json;
          food_preferences: Json;
          date_preferences: Json;
          important_notes: string[];
          ai_opt_in: boolean;
          last_ai_refresh_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          display_name?: string | null;
          birthday?: string | null;
          mbti?:
            | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
            | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
            | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
            | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
            | null;
          zodiac?: string | null;
          personality_summary?: string | null;
          gift_preferences?: Json;
          food_preferences?: Json;
          date_preferences?: Json;
          important_notes?: string[];
          ai_opt_in?: boolean;
          last_ai_refresh_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          display_name?: string | null;
          birthday?: string | null;
          mbti?:
            | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
            | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
            | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
            | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'
            | null;
          zodiac?: string | null;
          personality_summary?: string | null;
          gift_preferences?: Json;
          food_preferences?: Json;
          date_preferences?: Json;
          important_notes?: string[];
          ai_opt_in?: boolean;
          last_ai_refresh_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couple_memories: {
        Row: {
          id: string;
          group_id: string;
          subject_user_id: string | null;
          created_by: string;
          memory_type: 'preference' | 'constraint' | 'gift' | 'conflict_style' | 'anniversary' | 'inside_joke' | 'place' | 'manual_note';
          title: string;
          content: string;
          source_type: 'manual' | 'chat' | 'review' | 'wishlist' | 'ai_suggestion';
          source_ref_id: string | null;
          confidence: number;
          visibility: 'couple' | 'self_only';
          is_ai_usable: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          subject_user_id?: string | null;
          created_by: string;
          memory_type?: 'preference' | 'constraint' | 'gift' | 'conflict_style' | 'anniversary' | 'inside_joke' | 'place' | 'manual_note';
          title: string;
          content: string;
          source_type?: 'manual' | 'chat' | 'review' | 'wishlist' | 'ai_suggestion';
          source_ref_id?: string | null;
          confidence?: number;
          visibility?: 'couple' | 'self_only';
          is_ai_usable?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          subject_user_id?: string | null;
          created_by?: string;
          memory_type?: 'preference' | 'constraint' | 'gift' | 'conflict_style' | 'anniversary' | 'inside_joke' | 'place' | 'manual_note';
          title?: string;
          content?: string;
          source_type?: 'manual' | 'chat' | 'review' | 'wishlist' | 'ai_suggestion';
          source_ref_id?: string | null;
          confidence?: number;
          visibility?: 'couple' | 'self_only';
          is_ai_usable?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_wishlist: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          item_type: 'place' | 'activity';
          category: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          tags: string[];
          added_by: string;
          source_type: string;
          source_label: string | null;
          source_url: string | null;
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          rating: number | null;
          review_content: string | null;
          amount: number | null;
          currency: string;
          shared_review_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          item_type?: 'place' | 'activity';
          category?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          tags?: string[];
          added_by: string;
          source_type?: string;
          source_label?: string | null;
          source_url?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          rating?: number | null;
          review_content?: string | null;
          amount?: number | null;
          currency?: string;
          shared_review_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          item_type?: 'place' | 'activity';
          category?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          tags?: string[];
          added_by?: string;
          source_type?: string;
          source_label?: string | null;
          source_url?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          rating?: number | null;
          review_content?: string | null;
          amount?: number | null;
          currency?: string;
          shared_review_id?: string | null;
          created_at?: string;
          updated_at?: string;
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
          amount: number | null;
          currency: string;
          original_language: string;
          translations: Json;
          recommendation_count: number;
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
          amount?: number | null;
          currency?: string;
          original_language?: string;
          translations?: Json;
          recommendation_count?: number;
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
          amount?: number | null;
          currency?: string;
          original_language?: string;
          translations?: Json;
          recommendation_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_media: {
        Row: {
          id: string;
          review_id: string;
          media_type: 'image' | 'video';
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          media_type: 'image' | 'video';
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          media_type?: 'image' | 'video';
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      review_votes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          vote_type: 'recommend';
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          vote_type?: 'recommend';
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          vote_type?: 'recommend';
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
