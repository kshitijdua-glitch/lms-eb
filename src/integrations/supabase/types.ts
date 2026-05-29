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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_id: string
          call_at: string
          created_at: string
          disposition_code: string | null
          duration_seconds: number | null
          follow_up_at: string | null
          id: string
          lead_id: string
          next_action: string | null
          notes: string | null
          outcome: string
        }
        Insert: {
          agent_id: string
          call_at?: string
          created_at?: string
          disposition_code?: string | null
          duration_seconds?: number | null
          follow_up_at?: string | null
          id?: string
          lead_id: string
          next_action?: string | null
          notes?: string | null
          outcome: string
        }
        Update: {
          agent_id?: string
          call_at?: string
          created_at?: string
          disposition_code?: string | null
          duration_seconds?: number | null
          follow_up_at?: string | null
          id?: string
          lead_id?: string
          next_action?: string | null
          notes?: string | null
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositions: {
        Row: {
          active: boolean
          category: string
          code: string
          created_at: string
          id: string
          label: string
          outcome_group: string
          requires_follow_up: boolean
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          created_at?: string
          id?: string
          label: string
          outcome_group: string
          requires_follow_up?: boolean
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          created_at?: string
          id?: string
          label?: string
          outcome_group?: string
          requires_follow_up?: boolean
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          status: string
          sub_type: string | null
          type: string
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          status?: string
          sub_type?: string | null
          type?: string
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          sub_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_batches: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          invalid_count: number
          notes: string | null
          row_count: number
          source: string
          uploaded_by: string | null
          valid_count: number
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          invalid_count?: number
          notes?: string | null
          row_count?: number
          source: string
          uploaded_by?: string | null
          valid_count?: number
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          invalid_count?: number
          notes?: string | null
          row_count?: number
          source?: string
          uploaded_by?: string | null
          valid_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_existing_loans: {
        Row: {
          created_at: string
          emi: number | null
          id: string
          lead_id: string
          lender: string | null
          loan_type: string | null
          outstanding_amount: number | null
        }
        Insert: {
          created_at?: string
          emi?: number | null
          id?: string
          lead_id: string
          lender?: string | null
          loan_type?: string | null
          outstanding_amount?: number | null
        }
        Update: {
          created_at?: string
          emi?: number | null
          id?: string
          lead_id?: string
          lender?: string | null
          loan_type?: string | null
          outstanding_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_existing_loans_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_selected_partners: {
        Row: {
          id: string
          lead_id: string
          partner_id: string
          selected_at: string
          selected_by: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          partner_id: string
          selected_at?: string
          selected_by?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          partner_id?: string
          selected_at?: string
          selected_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_selected_partners_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_selected_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "lending_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_selected_partners_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          allocated_at: string | null
          assigned_agent_id: string | null
          assigned_at: string | null
          batch_id: string | null
          city: string | null
          created_at: string
          created_by: string | null
          credit_score: number | null
          designation: string | null
          disposition: string | null
          dob: string | null
          email: string | null
          employer_name: string | null
          employment_type: string | null
          existing_obligations: number
          expires_at: string | null
          foir: number | null
          full_name: string
          gender: string | null
          id: string
          last_activity_at: string
          loan_amount: number | null
          mobile: string
          monthly_income: number | null
          pan: string | null
          pincode: string | null
          priority: string
          priority_score: number
          product: string | null
          retry_count: number
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          state: string | null
          tenure_months: number | null
          updated_at: string
          work_experience_years: number | null
        }
        Insert: {
          allocated_at?: string | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          batch_id?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          designation?: string | null
          disposition?: string | null
          dob?: string | null
          email?: string | null
          employer_name?: string | null
          employment_type?: string | null
          existing_obligations?: number
          expires_at?: string | null
          foir?: number | null
          full_name: string
          gender?: string | null
          id?: string
          last_activity_at?: string
          loan_amount?: number | null
          mobile: string
          monthly_income?: number | null
          pan?: string | null
          pincode?: string | null
          priority?: string
          priority_score?: number
          product?: string | null
          retry_count?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tenure_months?: number | null
          updated_at?: string
          work_experience_years?: number | null
        }
        Update: {
          allocated_at?: string | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          batch_id?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          designation?: string | null
          disposition?: string | null
          dob?: string | null
          email?: string | null
          employer_name?: string | null
          employment_type?: string | null
          existing_obligations?: number
          expires_at?: string | null
          foir?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          last_activity_at?: string
          loan_amount?: number | null
          mobile?: string
          monthly_income?: number | null
          pan?: string | null
          pincode?: string | null
          priority?: string
          priority_score?: number
          product?: string | null
          retry_count?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tenure_months?: number | null
          updated_at?: string
          work_experience_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "lead_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lending_partners: {
        Row: {
          created_at: string
          id: string
          integration_type: string
          max_foir: number | null
          min_credit_score: number | null
          min_income: number | null
          name: string
          products: string[]
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_type?: string
          max_foir?: number | null
          min_credit_score?: number | null
          min_income?: number | null
          name: string
          products?: string[]
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_type?: string
          max_foir?: number | null
          min_credit_score?: number | null
          min_income?: number | null
          name?: string
          products?: string[]
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          id: string
          is_custom: boolean
          label: string
          slug: string
          status: Database["public"]["Enums"]["partner_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_custom?: boolean
          label: string
          slug: string
          status?: Database["public"]["Enums"]["partner_status"]
        }
        Update: {
          created_at?: string
          id?: string
          is_custom?: boolean
          label?: string
          slug?: string
          status?: Database["public"]["Enums"]["partner_status"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cluster_head_id: string | null
          created_at: string
          email: string
          id: string
          joined_at: string
          manager_id: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          cluster_head_id?: string | null
          created_at?: string
          email: string
          id: string
          joined_at?: string
          manager_id?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          cluster_head_id?: string | null
          created_at?: string
          email?: string
          id?: string
          joined_at?: string
          manager_id?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cluster_head_id_fkey"
            columns: ["cluster_head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slp_submissions: {
        Row: {
          approval_date: string | null
          disbursed_amount: number | null
          disbursement_date: string | null
          id: string
          last_update_note: string | null
          lead_id: string
          next_follow_up_at: string | null
          partner_id: string
          reference_id: string | null
          remarks: string | null
          sanction_amount: number | null
          status: Database["public"]["Enums"]["slp_status"]
          status_reason: string | null
          submitted_at: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          disbursed_amount?: number | null
          disbursement_date?: string | null
          id?: string
          last_update_note?: string | null
          lead_id: string
          next_follow_up_at?: string | null
          partner_id: string
          reference_id?: string | null
          remarks?: string | null
          sanction_amount?: number | null
          status?: Database["public"]["Enums"]["slp_status"]
          status_reason?: string | null
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          disbursed_amount?: number | null
          disbursement_date?: string | null
          id?: string
          last_update_note?: string | null
          lead_id?: string
          next_follow_up_at?: string | null
          partner_id?: string
          reference_id?: string | null
          remarks?: string | null
          sanction_amount?: number | null
          status?: Database["public"]["Enums"]["slp_status"]
          status_reason?: string | null
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slp_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slp_submissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "lending_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slp_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      can_access_lead: { Args: { _lead_id: string }; Returns: boolean }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "agent" | "manager" | "cluster_head" | "data_admin"
      lead_stage:
        | "new"
        | "allocated"
        | "in_progress"
        | "follow_up"
        | "partner_selected"
        | "submitted"
        | "approved"
        | "disbursed"
        | "declined"
        | "cancelled"
        | "expired"
      partner_status: "active" | "inactive"
      slp_status:
        | "submitted"
        | "in_review"
        | "approved"
        | "disbursed"
        | "declined"
        | "cancelled"
        | "on_hold"
      user_status: "active" | "inactive" | "suspended"
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
      app_role: ["agent", "manager", "cluster_head", "data_admin"],
      lead_stage: [
        "new",
        "allocated",
        "in_progress",
        "follow_up",
        "partner_selected",
        "submitted",
        "approved",
        "disbursed",
        "declined",
        "cancelled",
        "expired",
      ],
      partner_status: ["active", "inactive"],
      slp_status: [
        "submitted",
        "in_review",
        "approved",
        "disbursed",
        "declined",
        "cancelled",
        "on_hold",
      ],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
