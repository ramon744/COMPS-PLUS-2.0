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
      audit_logs: {
        Row: {
          acao: string
          created_em_local: string
          created_em_utc: string
          entidade: string
          entidade_id: string
          id: string
          payload_resumo: string
          user_id: string
        }
        Insert: {
          acao: string
          created_em_local: string
          created_em_utc?: string
          entidade: string
          entidade_id: string
          id?: string
          payload_resumo: string
          user_id: string
        }
        Update: {
          acao?: string
          created_em_local?: string
          created_em_utc?: string
          entidade?: string
          entidade_id?: string
          id?: string
          payload_resumo?: string
          user_id?: string
        }
        Relationships: []
      }
      closings: {
        Row: {
          created_at: string
          dia_operacional: string
          enviado_para: string[]
          fechado_em_local: string
          fechado_por: string
          id: string
          observacao: string | null
          periodo_fim_local: string
          periodo_inicio_local: string
          total_qtd: number
          total_valor_centavos: number
          updated_at: string
          url_csv: string | null
          url_pdf: string | null
          versao: number
        }
        Insert: {
          created_at?: string
          dia_operacional: string
          enviado_para?: string[]
          fechado_em_local: string
          fechado_por: string
          id?: string
          observacao?: string | null
          periodo_fim_local: string
          periodo_inicio_local: string
          total_qtd: number
          total_valor_centavos: number
          updated_at?: string
          url_csv?: string | null
          url_pdf?: string | null
          versao?: number
        }
        Update: {
          created_at?: string
          dia_operacional?: string
          enviado_para?: string[]
          fechado_em_local?: string
          fechado_por?: string
          id?: string
          observacao?: string | null
          periodo_fim_local?: string
          periodo_inicio_local?: string
          total_qtd?: number
          total_valor_centavos?: number
          updated_at?: string
          url_csv?: string | null
          url_pdf?: string | null
          versao?: number
        }
        Relationships: []
      }
      comp_types: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      comps: {
        Row: {
          cancelado_motivo: string | null
          comp_type_id: string
          created_at: string
          data_hora_local: string
          data_hora_utc: string
          dia_operacional: string
          foto_url: string | null
          gerente_id: string
          id: string
          motivo: string
          status: Database["public"]["Enums"]["comp_status"]
          turno: Database["public"]["Enums"]["shift_type"]
          updated_at: string
          valor_centavos: number
          waiter_id: string
        }
        Insert: {
          cancelado_motivo?: string | null
          comp_type_id: string
          created_at?: string
          data_hora_local: string
          data_hora_utc: string
          dia_operacional: string
          foto_url?: string | null
          gerente_id: string
          id?: string
          motivo: string
          status?: Database["public"]["Enums"]["comp_status"]
          turno: Database["public"]["Enums"]["shift_type"]
          updated_at?: string
          valor_centavos: number
          waiter_id: string
        }
        Update: {
          cancelado_motivo?: string | null
          comp_type_id?: string
          created_at?: string
          data_hora_local?: string
          data_hora_utc?: string
          dia_operacional?: string
          foto_url?: string | null
          gerente_id?: string
          id?: string
          motivo?: string
          status?: Database["public"]["Enums"]["comp_status"]
          turno?: Database["public"]["Enums"]["shift_type"]
          updated_at?: string
          valor_centavos?: number
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comps_comp_type"
            columns: ["comp_type_id"]
            isOneToOne: false
            referencedRelation: "comp_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comps_gerente"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comps_waiter"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "waiters"
            referencedColumns: ["id"]
          },
        ]
      }
      managers: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          ip_permitido: string | null
          nome: string
          senha: string
          tipo_acesso: Database["public"]["Enums"]["access_type"]
          updated_at: string
          usuario: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          ip_permitido?: string | null
          nome: string
          senha: string
          tipo_acesso?: Database["public"]["Enums"]["access_type"]
          updated_at?: string
          usuario: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          ip_permitido?: string | null
          nome?: string
          senha?: string
          tipo_acesso?: Database["public"]["Enums"]["access_type"]
          updated_at?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_managers_profile"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waiters: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          matricula: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string | null
          nome?: string
          updated_at?: string
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
      access_type: "qualquer_ip" | "ip_especifico"
      comp_status: "ativo" | "cancelado"
      shift_type: "manha" | "noite"
      user_role: "manager_day" | "manager_night" | "admin"
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
      access_type: ["qualquer_ip", "ip_especifico"],
      comp_status: ["ativo", "cancelado"],
      shift_type: ["manha", "noite"],
      user_role: ["manager_day", "manager_night", "admin"],
    },
  },
} as const
