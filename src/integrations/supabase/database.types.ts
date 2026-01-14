 
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
      issue_items: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string
          quantity: number
          sub_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id: string
          quantity?: number
          sub_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string
          quantity?: number
          sub_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_items_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "report_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_items_sub_item_id_fkey"
            columns: ["sub_item_id"]
            isOneToOne: false
            referencedRelation: "sub_items"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_photos: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string
          issue_item_id: string | null
          photo_order: number
          photo_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id: string
          issue_item_id?: string | null
          photo_order?: number
          photo_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string
          issue_item_id?: string | null
          photo_order?: number
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_photos_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "report_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_photos_issue_item_id_fkey"
            columns: ["issue_item_id"]
            isOneToOne: false
            referencedRelation: "issue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      main_items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_ar: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_ar: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_ar?: string
        }
        Relationships: []
      }
      mosques: {
        Row: {
          city: string
          created_at: string | null
          created_by: string | null
          district: string
          id: string
          latitude: number | null
          location_link: string | null
          longitude: number | null
          main_photo_url: string | null
          name: string
          supervisor_name: string
          supervisor_phone: string
          updated_at: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          created_by?: string | null
          district: string
          id?: string
          latitude?: number | null
          location_link?: string | null
          longitude?: number | null
          main_photo_url?: string | null
          name: string
          supervisor_name: string
          supervisor_phone: string
          updated_at?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          created_by?: string | null
          district?: string
          id?: string
          latitude?: number | null
          location_link?: string | null
          longitude?: number | null
          main_photo_url?: string | null
          name?: string
          supervisor_name?: string
          supervisor_phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mosques_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      report_issues: {
        Row: {
          created_at: string | null
          id: string
          issue_type: string
          main_item_id: string
          notes: string | null
          report_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_type: string
          main_item_id: string
          notes?: string | null
          report_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_type?: string
          main_item_id?: string
          notes?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_issues_main_item_id_fkey"
            columns: ["main_item_id"]
            isOneToOne: false
            referencedRelation: "main_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_issues_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          mosque_id: string
          report_date: string | null
          status: string
          technician_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mosque_id: string
          report_date?: string | null
          status?: string
          technician_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mosque_id?: string
          report_date?: string | null
          status?: string
          technician_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_mosque_id_fkey"
            columns: ["mosque_id"]
            isOneToOne: false
            referencedRelation: "mosques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_items: {
        Row: {
          created_at: string | null
          id: string
          main_item_id: string
          name: string
          name_ar: string
          name_table: string | null
          unit: string
          unit_ar: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          main_item_id: string
          name: string
          name_ar: string
          name_table?: string | null
          unit: string
          unit_ar: string
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          main_item_id?: string
          name?: string
          name_ar?: string
          name_table?: string | null
          unit?: string
          unit_ar?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_items_main_item_id_fkey"
            columns: ["main_item_id"]
            isOneToOne: false
            referencedRelation: "main_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
