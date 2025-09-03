export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          report_type: string
          reported_user_id: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          report_type: string
          reported_user_id: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          report_type?: string
          reported_user_id?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      blind_dates: {
        Row: {
          created_at: string
          id: string
          location: string | null
          message: string | null
          proposed_date: string
          recipient_id: string
          requester_id: string
          status: Database["public"]["Enums"]["blind_date_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          message?: string | null
          proposed_date: string
          recipient_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["blind_date_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          message?: string | null
          proposed_date?: string
          recipient_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["blind_date_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          match_id: string
          message_text: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          message_text?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          message_text?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          city: string
          created_at: string
          id: string
          is_verified: boolean | null
          name: string
          state: string
          tier: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          name: string
          state: string
          tier?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          name?: string
          state?: string
          tier?: string
        }
        Relationships: []
      }
      compatibility_scores: {
        Row: {
          calculated_at: string
          compatibility_score: number
          id: string
          mental_score: number | null
          physical_score: number | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          calculated_at?: string
          compatibility_score: number
          id?: string
          mental_score?: number | null
          physical_score?: number | null
          user1_id: string
          user2_id: string
        }
        Update: {
          calculated_at?: string
          compatibility_score?: number
          id?: string
          mental_score?: number | null
          physical_score?: number | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          govt_id_image_url: string | null
          govt_id_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          govt_id_submitted_at: string | null
          govt_id_verified_at: string | null
          id: string
          rejection_reason: string | null
          student_id_image_url: string | null
          student_id_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          student_id_submitted_at: string | null
          student_id_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          govt_id_image_url?: string | null
          govt_id_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          govt_id_submitted_at?: string | null
          govt_id_verified_at?: string | null
          id?: string
          rejection_reason?: string | null
          student_id_image_url?: string | null
          student_id_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          student_id_submitted_at?: string | null
          student_id_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          govt_id_image_url?: string | null
          govt_id_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          govt_id_submitted_at?: string | null
          govt_id_verified_at?: string | null
          id?: string
          rejection_reason?: string | null
          student_id_image_url?: string | null
          student_id_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          student_id_submitted_at?: string | null
          student_id_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          compatibility_score: number | null
          created_at: string
          id: string
          liked_id: string
          liker_id: string
          mental_score: number | null
          physical_score: number | null
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
          mental_score?: number | null
          physical_score?: number | null
          status: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
          mental_score?: number | null
          physical_score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      partner_preferences: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          created_at: string
          id: string
          preferred_gender: string[] | null
          preferred_relationship_goal: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          id?: string
          preferred_gender?: string[] | null
          preferred_relationship_goal?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          created_at?: string
          id?: string
          preferred_gender?: string[] | null
          preferred_relationship_goal?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          blinddate_requests_left: number | null
          college_id_url: string | null
          college_tier: string | null
          compatibility_preferences: Json | null
          created_at: string
          daily_incoming_matches: number | null
          daily_outgoing_matches: number | null
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          govt_id_url: string | null
          govt_id_verified: boolean | null
          height: number | null
          humor_type: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_profile_public: boolean | null
          last_name: string
          last_reset: string | null
          lifestyle: Json | null
          location: string | null
          love_language: string | null
          major: string | null
          pairing_requests_left: number | null
          personality_type: string | null
          profile_completion_percentage: number | null
          profile_images: string[] | null
          qualities: Json | null
          questions_answered: number | null
          relationship_goals: string[] | null
          relationship_status: string | null
          reports_count: number | null
          requirements: Json | null
          show_profile: boolean | null
          student_id_verified: boolean | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          swipes_left: number | null
          total_qcs: number | null
          university: string
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          year_of_study: number | null
        }
        Insert: {
          bio?: string | null
          blinddate_requests_left?: number | null
          college_id_url?: string | null
          college_tier?: string | null
          compatibility_preferences?: Json | null
          created_at?: string
          daily_incoming_matches?: number | null
          daily_outgoing_matches?: number | null
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          govt_id_url?: string | null
          govt_id_verified?: boolean | null
          height?: number | null
          humor_type?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          last_name: string
          last_reset?: string | null
          lifestyle?: Json | null
          location?: string | null
          love_language?: string | null
          major?: string | null
          pairing_requests_left?: number | null
          personality_type?: string | null
          profile_completion_percentage?: number | null
          profile_images?: string[] | null
          qualities?: Json | null
          questions_answered?: number | null
          relationship_goals?: string[] | null
          relationship_status?: string | null
          reports_count?: number | null
          requirements?: Json | null
          show_profile?: boolean | null
          student_id_verified?: boolean | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          swipes_left?: number | null
          total_qcs?: number | null
          university: string
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          year_of_study?: number | null
        }
        Update: {
          bio?: string | null
          blinddate_requests_left?: number | null
          college_id_url?: string | null
          college_tier?: string | null
          compatibility_preferences?: Json | null
          created_at?: string
          daily_incoming_matches?: number | null
          daily_outgoing_matches?: number | null
          date_of_birth?: string
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          govt_id_url?: string | null
          govt_id_verified?: boolean | null
          height?: number | null
          humor_type?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          last_name?: string
          last_reset?: string | null
          lifestyle?: Json | null
          location?: string | null
          love_language?: string | null
          major?: string | null
          pairing_requests_left?: number | null
          personality_type?: string | null
          profile_completion_percentage?: number | null
          profile_images?: string[] | null
          qualities?: Json | null
          questions_answered?: number | null
          relationship_goals?: string[] | null
          relationship_status?: string | null
          reports_count?: number | null
          requirements?: Json | null
          show_profile?: boolean | null
          student_id_verified?: boolean | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          swipes_left?: number | null
          total_qcs?: number | null
          university?: string
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          year_of_study?: number | null
        }
        Relationships: []
      }
      qcs: {
        Row: {
          behavior_score: number | null
          college_tier: number | null
          created_at: string
          id: string
          personality_depth: number | null
          profile_score: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          behavior_score?: number | null
          college_tier?: number | null
          created_at?: string
          id?: string
          personality_depth?: number | null
          profile_score?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          behavior_score?: number | null
          college_tier?: number | null
          created_at?: string
          id?: string
          personality_depth?: number | null
          profile_score?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          amount: number
          created_at: string
          end_date: string
          id: string
          payment_id: string | null
          start_date: string
          status: string | null
          tier: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date: string
          id?: string
          payment_id?: string | null
          start_date: string
          status?: string | null
          tier: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string
          id?: string
          payment_id?: string | null
          start_date?: string
          status?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          blinddate_limit: number
          id: string
          pairing_limit: number
          subscription_tier: Database["public"]["Enums"]["app_subscription_tier"]
          swipe_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          blinddate_limit?: number
          id?: string
          pairing_limit?: number
          subscription_tier?: Database["public"]["Enums"]["app_subscription_tier"]
          swipe_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          blinddate_limit?: number
          id?: string
          pairing_limit?: number
          subscription_tier?: Database["public"]["Enums"]["app_subscription_tier"]
          swipe_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          candidate_id: string
          created_at: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_compatibility: {
        Args: { user1_profile: Json; user2_profile: Json }
        Returns: number
      }
      calculate_profile_completion: {
        Args: { profile_data: Json }
        Returns: number
      }
      increment_reports_count: {
        Args: { user_id: string }
        Returns: undefined
      }
      reset_daily_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_subscription_tier: "free" | "basic" | "plus" | "premium"
      blind_date_status: "pending" | "accepted" | "declined" | "completed"
      gender: "male" | "female" | "non_binary" | "prefer_not_to_say"
      match_status: "liked" | "passed" | "matched"
      swipe_direction: "left" | "right"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_subscription_tier: ["free", "basic", "plus", "premium"],
      blind_date_status: ["pending", "accepted", "declined", "completed"],
      gender: ["male", "female", "non_binary", "prefer_not_to_say"],
      match_status: ["liked", "passed", "matched"],
      swipe_direction: ["left", "right"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
