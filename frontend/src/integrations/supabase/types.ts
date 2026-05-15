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
      accommodation_entries: {
        Row: {
          accommodation_type: string | null
          booking_id: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          id: string
          is_manual: boolean
          obs: string | null
          package_title: string | null
          pax: number
          purchase_type: string
          updated_at: string
        }
        Insert: {
          accommodation_type?: string | null
          booking_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_manual?: boolean
          obs?: string | null
          package_title?: string | null
          pax?: number
          purchase_type?: string
          updated_at?: string
        }
        Update: {
          accommodation_type?: string | null
          booking_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_manual?: boolean
          obs?: string | null
          package_title?: string | null
          pax?: number
          purchase_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          canceled_by: string | null
          created_at: string
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          package_id: string
          passengers: Json
          payment_method: string | null
          payment_proof_url: string | null
          quantity: number
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          canceled_by?: string | null
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          package_id: string
          passengers?: Json
          payment_method?: string | null
          payment_proof_url?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          unit_price: number
          updated_at?: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          canceled_by?: string | null
          created_at?: string
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          package_id?: string
          passengers?: Json
          payment_method?: string | null
          payment_proof_url?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          label: string
          slug: string
        }
        Insert: {
          created_at?: string
          label: string
          slug: string
        }
        Update: {
          created_at?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      package_types: {
        Row: {
          created_at: string
          discount_percent: number
          label: string
          slug: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          label: string
          slug: string
        }
        Update: {
          created_at?: string
          discount_percent?: number
          label?: string
          slug?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          available_spots: number
          category: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          departure_date: string
          description: string
          duration_days: number
          gallery: string[] | null
          id: string
          included: string | null
          is_active: boolean
          is_featured: boolean
          itinerary: string | null
          location: string
          package_type: string | null
          price: number
          title: string
          total_spots: number
          updated_at: string
        }
        Insert: {
          available_spots: number
          category: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          departure_date: string
          description: string
          duration_days?: number
          gallery?: string[] | null
          id?: string
          included?: string | null
          is_active?: boolean
          is_featured?: boolean
          itinerary?: string | null
          location: string
          package_type?: string | null
          price: number
          title: string
          total_spots: number
          updated_at?: string
        }
        Update: {
          available_spots?: number
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          departure_date?: string
          description?: string
          duration_days?: number
          gallery?: string[] | null
          id?: string
          included?: string | null
          is_active?: boolean
          is_featured?: boolean
          itinerary?: string | null
          location?: string
          package_type?: string | null
          price?: number
          title?: string
          total_spots?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "packages_package_type_fkey"
            columns: ["package_type"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["slug"]
          },
        ]
      }
      payment_settings: {
        Row: {
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string
          id: string
          instructions: string | null
          mp_access_token: string | null
          mp_enabled: boolean
          mp_mode: string
          pix_enabled: boolean
          pix_holder_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          mp_access_token?: string | null
          mp_enabled?: boolean
          mp_mode?: string
          pix_enabled?: boolean
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          mp_access_token?: string | null
          mp_enabled?: boolean
          mp_mode?: string
          pix_enabled?: boolean
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          rg: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          title?: string | null
          updated_at?: string
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
      get_public_payment_info: {
        Args: never
        Returns: {
          bank_account: string
          bank_agency: string
          bank_name: string
          instructions: string
          mp_enabled: boolean
          pix_enabled: boolean
          pix_holder_name: string
          pix_key: string
          pix_key_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente"
      booking_status:
        | "pendente"
        | "pago"
        | "confirmado"
        | "cancelado"
        | "aguardando_pagamento"
        | "concluido"
        | "pagamento_finalizado"
      package_category: "bate_volta" | "casal" | "excursao"
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
      app_role: ["admin", "cliente"],
      booking_status: [
        "pendente",
        "pago",
        "confirmado",
        "cancelado",
        "aguardando_pagamento",
        "concluido",
        "pagamento_finalizado",
      ],
      package_category: ["bate_volta", "casal", "excursao"],
    },
  },
} as const
