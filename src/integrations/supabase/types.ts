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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      dismissed_pattern_insights: {
        Row: {
          dismissed_at: string | null
          id: string
          insight_type: string
          user_plant_id: string
        }
        Insert: {
          dismissed_at?: string | null
          id?: string
          insight_type: string
          user_plant_id: string
        }
        Update: {
          dismissed_at?: string | null
          id?: string
          insight_type?: string
          user_plant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_pattern_insights_user_plant_id_fkey"
            columns: ["user_plant_id"]
            isOneToOne: false
            referencedRelation: "user_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_suggestions: {
        Row: {
          dismissed_at: string
          expires_at: string
          id: string
          plant_id: string
          reason: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          expires_at: string
          id?: string
          plant_id: string
          reason: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          expires_at?: string
          id?: string
          plant_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_suggestions_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "user_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invitations: {
        Row: {
          created_at: string | null
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          household_id: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plant_seasonal_schedules: {
        Row: {
          applied_at: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          plant_id: string | null
          season: string
          user_modified: boolean | null
          watering_days: number
          weather_conditions: Json | null
          year: number
        }
        Insert: {
          applied_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          plant_id?: string | null
          season: string
          user_modified?: boolean | null
          watering_days: number
          weather_conditions?: Json | null
          year: number
        }
        Update: {
          applied_at?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          plant_id?: string | null
          season?: string
          user_modified?: boolean | null
          watering_days?: number
          weather_conditions?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "plant_seasonal_schedules_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants_with_watering_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_seasonal_schedules_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "user_plants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          updated_at: string
          username: string
          push_notifications_enabled: boolean | null
          push_notification_time: string | null
          push_notification_timezone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id: string
          last_name: string
          updated_at?: string
          username: string
          push_notifications_enabled?: boolean | null
          push_notification_time?: string | null
          push_notification_timezone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          username?: string
          push_notifications_enabled?: boolean | null
          push_notification_time?: string | null
          push_notification_timezone?: string | null
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          device_type: 'ios' | 'android' | 'web'
          device_name: string | null
          created_at: string
          updated_at: string
          last_used_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          device_type: 'ios' | 'android' | 'web'
          device_name?: string | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          device_type?: 'ios' | 'android' | 'web'
          device_name?: string | null
          created_at?: string
          updated_at?: string
          last_used_at?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          plant_id: string | null
          sent_at: string
          status: 'sent' | 'failed' | 'skipped'
          error_message: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          plant_id?: string | null
          sent_at?: string
          status: 'sent' | 'failed' | 'skipped'
          error_message?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          plant_id?: string | null
          sent_at?: string
          status?: 'sent' | 'failed' | 'skipped'
          error_message?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "user_plants"
            referencedColumns: ["id"]
          }
        ]
      }
      seasonal_review_notifications: {
        Row: {
          id: string
          notification_sent_at: string | null
          response_type: string | null
          season: string
          user_id: string | null
          user_responded_at: string | null
          year: number
        }
        Insert: {
          id?: string
          notification_sent_at?: string | null
          response_type?: string | null
          season: string
          user_id?: string | null
          user_responded_at?: string | null
          year: number
        }
        Update: {
          id?: string
          notification_sent_at?: string | null
          response_type?: string | null
          season?: string
          user_id?: string | null
          user_responded_at?: string | null
          year?: number
        }
        Relationships: []
      }
      user_plants: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          image: string | null
          is_outdoor_plant: boolean | null
          last_postponement_date: string | null
          last_schedule_review: string | null
          nickname: string
          plant_type: string
          postponement_count: number | null
          room: string | null
          suggested_watering_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          image?: string | null
          is_outdoor_plant?: boolean | null
          last_postponement_date?: string | null
          last_schedule_review?: string | null
          nickname: string
          plant_type: string
          postponement_count?: number | null
          room?: string | null
          suggested_watering_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          image?: string | null
          is_outdoor_plant?: boolean | null
          last_postponement_date?: string | null
          last_schedule_review?: string | null
          nickname?: string
          plant_type?: string
          postponement_count?: number | null
          room?: string | null
          suggested_watering_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plants_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      user_watering_preferences: {
        Row: {
          created_at: string | null
          default_care_style: string
          default_humidity: string
          default_light_level: string
          default_soil_type: string
          default_temperature: string
          id: string
          last_weather_update: string | null
          location: string | null
          manual_location: string | null
          temperature_unit: string
          updated_at: string | null
          use_weather_data: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_care_style: string
          default_humidity: string
          default_light_level: string
          default_soil_type: string
          default_temperature: string
          id?: string
          last_weather_update?: string | null
          location?: string | null
          manual_location?: string | null
          temperature_unit?: string
          updated_at?: string | null
          use_weather_data?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_care_style?: string
          default_humidity?: string
          default_light_level?: string
          default_soil_type?: string
          default_temperature?: string
          id?: string
          last_weather_update?: string | null
          location?: string | null
          manual_location?: string | null
          temperature_unit?: string
          updated_at?: string | null
          use_weather_data?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      watering_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          performed_by: string | null
          plant_id: string
          watered_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          plant_id: string
          watered_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          plant_id?: string
          watered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watering_records_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants_with_watering_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watering_records_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "user_plants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      plants_with_watering_info: {
        Row: {
          created_at: string | null
          days_since_watering: number | null
          household_id: string | null
          id: string | null
          image: string | null
          is_outdoor_plant: boolean | null
          last_watered_at: string | null
          last_watering_notes: string | null
          nickname: string | null
          plant_type: string | null
          room: string | null
          suggested_watering_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_plants_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_household_invitation: {
        Args: { invitation_id: string }
        Returns: boolean
      }
      create_household: {
        Args: { household_description?: string; household_name: string }
        Returns: string
      }
      decline_household_invitation: {
        Args: { invitation_id: string }
        Returns: boolean
      }
      delete_test_user:
        | { Args: never; Returns: undefined }
        | { Args: { user_id: string }; Returns: Json }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_user_household_memberships: {
        Args: { target_user_id: string }
        Returns: {
          household_id: string
          role: string
        }[]
      }
      invite_to_household: {
        Args: {
          household_id: string
          invitation_role?: string
          invited_email: string
        }
        Returns: string
      }
      leave_household: { Args: { household_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
