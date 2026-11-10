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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transaction_costs: {
        Row: {
          transaction_id: string
          unit_cost_at_time: number | null
        }
        Insert: {
          transaction_id: string
          unit_cost_at_time?: number | null
        }
        Update: {
          transaction_id?: string
          unit_cost_at_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transaction_costs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "inventory_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transaction_costs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "v_transactions_list"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          delta: number
          id: string
          job_id: string | null
          material_id: string
          quantity: number
          reason: string | null
          txn_code: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          job_id?: string | null
          material_id: string
          quantity: number
          reason?: string | null
          txn_code: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          job_id?: string | null
          material_id?: string
          quantity?: number
          reason?: string | null
          txn_code?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "v_material_status"
            referencedColumns: ["id"]
          },
        ]
      }
      job_code_counters: {
        Row: {
          last_seq: number
          year: number
        }
        Insert: {
          last_seq?: number
          year: number
        }
        Update: {
          last_seq?: number
          year?: number
        }
        Relationships: []
      }
      job_pricing: {
        Row: {
          job_id: string
          quoted_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          job_id: string
          quoted_price: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          job_id?: string
          quoted_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_pricing_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pricing_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "v_jobs_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pricing_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: string | null
          id: number
          job_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: number
          job_id: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: number
          job_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          id: string
          job_id: string
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          job_id: string
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          job_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          description: string | null
          expected_completion: string | null
          id: string
          job_code: string
          order_date: string
          project_name: string
          status: string
          status_changed_at: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          job_code: string
          order_date: string
          project_name: string
          status?: string
          status_changed_at?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          description?: string | null
          expected_completion?: string | null
          id?: string
          job_code?: string
          order_date?: string
          project_name?: string
          status?: string
          status_changed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      material_costs: {
        Row: {
          material_id: string
          unit_cost: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          material_id: string
          unit_cost: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          material_id?: string
          unit_cost?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_costs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_costs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "v_material_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_costs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          current_stock: number
          deleted_at: string | null
          id: string
          material_code: string
          minimum_level: number
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          deleted_at?: string | null
          id?: string
          material_code: string
          minimum_level?: number
          name: string
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          current_stock?: number
          deleted_at?: string | null
          id?: string
          material_code?: string
          minimum_level?: number
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          email: string
          full_name: string
          id: string
          preferences: Json
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          email: string
          full_name: string
          id: string
          preferences?: Json
          role: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          email?: string
          full_name?: string
          id?: string
          preferences?: Json
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      usability_feedback: {
        Row: {
          created_at: string
          id: string
          note: string | null
          page: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          page: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          page?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usability_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_jobs_list: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          expected_completion: string | null
          id: string | null
          job_code: string | null
          order_date: string | null
          project_name: string | null
          status: string | null
          status_changed_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_material_status: {
        Row: {
          category: string | null
          current_stock: number | null
          deleted_at: string | null
          id: string | null
          material_code: string | null
          minimum_level: number | null
          name: string | null
          shortfall: number | null
          stock_status: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          current_stock?: number | null
          deleted_at?: string | null
          id?: string | null
          material_code?: string | null
          minimum_level?: number | null
          name?: string | null
          shortfall?: never
          stock_status?: never
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          current_stock?: number | null
          deleted_at?: string | null
          id?: string | null
          material_code?: string | null
          minimum_level?: number | null
          name?: string | null
          shortfall?: never
          stock_status?: never
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_transactions_list: {
        Row: {
          created_at: string | null
          created_by: string | null
          delta: number | null
          id: string | null
          job_code: string | null
          job_id: string | null
          material_id: string | null
          material_name: string | null
          quantity: number | null
          reason: string | null
          txn_code: string | null
          type: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_jobs_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "v_material_status"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_job_order: {
        Args: {
          p_assigned_to: string
          p_customer_id: string
          p_description: string
          p_expected_completion: string
          p_order_date: string
          p_project_name: string
          p_quoted_price?: number
          p_status: string
        }
        Returns: {
          job_code: string
          job_id: string
        }[]
      }
      current_app_role: { Args: never; Returns: string }
      dashboard_summary: { Args: never; Returns: Json }
      is_staff: { Args: never; Returns: boolean }
      job_material_cost: { Args: { p_job_id: string }; Returns: number }
      next_job_code: { Args: never; Returns: string }
      next_material_code: { Args: never; Returns: string }
      next_transaction_code: { Args: never; Returns: string }
      record_stock_movement: {
        Args: {
          p_direction?: number
          p_job_id?: string
          p_material_id: string
          p_quantity: number
          p_reason?: string
          p_type: string
        }
        Returns: {
          material_name: string
          new_stock: number
          transaction_id: string
          txn_code: string
          unit: string
        }[]
      }
      report_summary: { Args: { p_from: string; p_to: string }; Returns: Json }
      update_job_order: {
        Args: {
          p_assigned_to: string
          p_clear_price?: boolean
          p_customer_id: string
          p_description: string
          p_expected_completion: string
          p_job_id: string
          p_order_date: string
          p_project_name: string
          p_quoted_price?: number
          p_status: string
        }
        Returns: {
          job_code: string
          job_id: string
          new_status: string
          old_status: string
        }[]
      }
      update_job_status: {
        Args: { p_job_id: string; p_status: string }
        Returns: {
          job_id: string
          new_status: string
          old_status: string
        }[]
      }
      upsert_material: {
        Args: {
          p_category: string
          p_material_id?: string
          p_minimum_level: number
          p_name: string
          p_opening_stock?: number
          p_unit: string
          p_unit_cost?: number
        }
        Returns: {
          current_stock: number
          material_code: string
          material_id: string
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
