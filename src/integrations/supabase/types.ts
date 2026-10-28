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
      categorias: {
        Row: {
          ativa: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          email: string
          estado: string | null
          id: string
          nome: string
          numero: string | null
          rua: string | null
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email: string
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          rua?: string | null
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          rua?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          cor_destaque: string | null
          id: number
          logo_url: string | null
          pedido_minimo: number
          texto_boas_vindas: string | null
          texto_privacidade: string | null
          texto_sobre: string | null
          texto_trocas: string | null
          updated_at: string
          whatsapp_loja: string
        }
        Insert: {
          cor_destaque?: string | null
          id?: number
          logo_url?: string | null
          pedido_minimo?: number
          texto_boas_vindas?: string | null
          texto_privacidade?: string | null
          texto_sobre?: string | null
          texto_trocas?: string | null
          updated_at?: string
          whatsapp_loja?: string
        }
        Update: {
          cor_destaque?: string | null
          id?: number
          logo_url?: string | null
          pedido_minimo?: number
          texto_boas_vindas?: string | null
          texto_privacidade?: string | null
          texto_sobre?: string | null
          texto_trocas?: string | null
          updated_at?: string
          whatsapp_loja?: string
        }
        Relationships: []
      }
      kits_preco: {
        Row: {
          ativo: boolean
          id: string
          preco: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          ativo?: boolean
          id?: string
          preco: number
          produto_id: string
          quantidade: number
        }
        Update: {
          ativo?: boolean
          id?: string
          preco?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "kits_preco_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          faixa: number | null
          id: string
          kit: number | null
          observacao: string | null
          pedido_id: string
          preco_unitario: number | null
          produto_id: string | null
          qtd_g: number
          qtd_gg: number
          qtd_m: number
          qtd_p: number
          valor: number
        }
        Insert: {
          faixa?: number | null
          id?: string
          kit?: number | null
          observacao?: string | null
          pedido_id: string
          preco_unitario?: number | null
          produto_id?: string | null
          qtd_g?: number
          qtd_gg?: number
          qtd_m?: number
          qtd_p?: number
          valor: number
        }
        Update: {
          faixa?: number | null
          id?: string
          kit?: number | null
          observacao?: string | null
          pedido_id?: string
          preco_unitario?: number | null
          produto_id?: string | null
          qtd_g?: number
          qtd_gg?: number
          qtd_m?: number
          qtd_p?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          numero_sequencial: number
          observacao: string | null
          status: Database["public"]["Enums"]["pedido_status"]
          total: number
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          numero_sequencial?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          total?: number
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          numero_sequencial?: number
          observacao?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          composicao: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          estoque_pecas: number
          id: string
          imagens: string[]
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          estoque_pecas?: number
          id?: string
          imagens?: string[]
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          composicao?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          estoque_pecas?: number
          id?: string
          imagens?: string[]
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      pedido_status:
        | "novo"
        | "em_atendimento"
        | "pago"
        | "enviado"
        | "cancelado"
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
    Enums: {
      app_role: ["admin", "user"],
      pedido_status: ["novo", "em_atendimento", "pago", "enviado", "cancelado"],
    },
  },
} as const
