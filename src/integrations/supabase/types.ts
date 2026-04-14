export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          user_id: string
          date: string
          type: string
          title: string | null
          custom_type: string | null
          duration_minutes: number | null
          distance_km: number | null
          pace_per_km: number | null
          laps: number | null
          pool_length_m: number | null
          pushups: number | null
          situps: number | null
          run_seconds: number | null
          sets: number | null
          reps: number | null
          weight_kg: number | null
          description: string | null
          image_url: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: string
          title?: string | null
          custom_type?: string | null
          duration_minutes?: number | null
          distance_km?: number | null
          pace_per_km?: number | null
          laps?: number | null
          pool_length_m?: number | null
          pushups?: number | null
          situps?: number | null
          run_seconds?: number | null
          sets?: number | null
          reps?: number | null
          weight_kg?: number | null
          description?: string | null
          image_url?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: string
          title?: string | null
          custom_type?: string | null
          duration_minutes?: number | null
          distance_km?: number | null
          pace_per_km?: number | null
          laps?: number | null
          pool_length_m?: number | null
          pushups?: number | null
          situps?: number | null
          run_seconds?: number | null
          sets?: number | null
          reps?: number | null
          weight_kg?: number | null
          description?: string | null
          image_url?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Relationships: []
      }
      approval_actions: {
        Row: {
          action: string
          approver_id: string
          comments: string | null
          created_at: string
          expense_id: string
          id: string
          level: Database["public"]["Enums"]["approval_level"]
        }
        Insert: {
          action: string
          approver_id: string
          comments?: string | null
          created_at?: string
          expense_id: string
          id?: string
          level: Database["public"]["Enums"]["approval_level"]
        }
        Update: {
          action?: string
          approver_id?: string
          comments?: string | null
          created_at?: string
          expense_id?: string
          id?: string
          level?: Database["public"]["Enums"]["approval_level"]
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          expense_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          expense_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          expense_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      bmi_results: {
        Row: {
          id: string
          user_id: string
          height_cm: number | null
          weight_kg: number | null
          bmi: number | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          height_cm?: number | null
          weight_kg?: number | null
          bmi?: number | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          height_cm?: number | null
          weight_kg?: number | null
          bmi?: number | null
          category?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expense_receipts: {
        Row: {
          expense_id: string
          file_name: string
          file_path: string
          id: string
          uploaded_at: string
        }
        Insert: {
          expense_id: string
          file_name: string
          file_path: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          expense_id?: string
          file_name?: string
          file_path?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          cost_center: string | null
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          merchant: string | null
          status: Database["public"]["Enums"]["expense_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          merchant?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          merchant?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ippt_results: {
        Row: {
          id: string
          user_id: string
          pushups: number | null
          situps: number | null
          run_seconds: number | null
          total_score: number | null
          award: string | null
          age: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pushups?: number | null
          situps?: number | null
          run_seconds?: number | null
          total_score?: number | null
          award?: string | null
          age?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pushups?: number | null
          situps?: number | null
          run_seconds?: number | null
          total_score?: number | null
          award?: string | null
          age?: number | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          department: string
          manager_id: string | null
          rank: string
          age: number | null
          height_cm: number | null
          ippt_score: number | null
          ippt_pushups: number | null
          ippt_situps: number | null
          ippt_run_seconds: number | null
          is_admin: boolean | null
          team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          department?: string
          manager_id?: string | null
          rank?: string
          age?: number | null
          height_cm?: number | null
          ippt_score?: number | null
          ippt_pushups?: number | null
          ippt_situps?: number | null
          ippt_run_seconds?: number | null
          is_admin?: boolean | null
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          department?: string
          manager_id?: string | null
          rank?: string
          age?: number | null
          height_cm?: number | null
          ippt_score?: number | null
          ippt_pushups?: number | null
          ippt_situps?: number | null
          ippt_run_seconds?: number | null
          is_admin?: boolean | null
          team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activities: {
        Row: {
          id: string
          activity_id: string
          team_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          team_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          team_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          invite_code?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          invite_code?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _employee_id: string; _manager_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "employee" | "manager" | "finance"
      approval_level: "manager" | "finance"
      expense_status:
        | "draft"
        | "submitted"
        | "manager_approved"
        | "approved"
        | "rejected"
        | "reimbursed"
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
      app_role: ["employee", "manager", "finance"],
      approval_level: ["manager", "finance"],
      expense_status: [
        "draft",
        "submitted",
        "manager_approved",
        "approved",
        "rejected",
        "reimbursed",
      ],
    },
  },
} as const
