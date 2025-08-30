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
          created_at: string
          id: string
          liked_id: string
          liker_id: string
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
          status: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
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
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          govt_id_verified: boolean | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          last_name: string
          location: string | null
          major: string | null
          profile_images: string[] | null
          student_id_verified: boolean | null
          university: string
          updated_at: string
          user_id: string
          year_of_study: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          date_of_birth: string
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          govt_id_verified?: boolean | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name: string
          location?: string | null
          major?: string | null
          profile_images?: string[] | null
          student_id_verified?: boolean | null
          university: string
          updated_at?: string
          user_id: string
          year_of_study?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          govt_id_verified?: boolean | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name?: string
          location?: string | null
          major?: string | null
          profile_images?: string[] | null
          student_id_verified?: boolean | null
          university?: string
          updated_at?: string
          user_id?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      blind_date_status: "pending" | "accepted" | "declined" | "completed"
      gender: "male" | "female" | "non_binary" | "prefer_not_to_say"
      match_status: "liked" | "passed" | "matched"
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
      blind_date_status: ["pending", "accepted", "declined", "completed"],
      gender: ["male", "female", "non_binary", "prefer_not_to_say"],
      match_status: ["liked", "passed", "matched"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
