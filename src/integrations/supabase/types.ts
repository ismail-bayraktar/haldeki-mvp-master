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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          business_type: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          region_ids: string[] | null
          tax_number: string | null
          tax_office: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          business_type?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          region_ids?: string[] | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          business_type?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          region_ids?: string[] | null
          tax_number?: string | null
          tax_office?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dealer_customers: {
        Row: {
          address: string | null
          business_name: string
          contact_name: string | null
          created_at: string | null
          dealer_id: string
          district: string | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          contact_name?: string | null
          created_at?: string | null
          dealer_id: string
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          contact_name?: string | null
          created_at?: string | null
          dealer_id?: string
          district?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_customers_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          region_ids: string[] | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region_ids?: string[] | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region_ids?: string[] | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          dealer_id: string | null
          delivered_at: string | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          delivery_slot: Json | null
          estimated_delivery_time: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string | null
          payment_method_details: Json | null
          payment_notes: string | null
          payment_status: string | null
          region_id: string | null
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dealer_id?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          delivery_slot?: Json | null
          estimated_delivery_time?: string | null
          id?: string
          items: Json
          notes?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_notes?: string | null
          payment_status?: string | null
          region_id?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          dealer_id?: string | null
          delivered_at?: string | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          delivery_slot?: Json | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_notes?: string | null
          payment_status?: string | null
          region_id?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_notifications: {
        Row: {
          account_holder: string
          amount: number
          bank_name: string
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          receipt_url: string | null
          status: string | null
          transaction_date: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder: string
          amount: number
          bank_name: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          receipt_url?: string | null
          status?: string | null
          transaction_date: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder?: string
          amount?: number
          bank_name?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          receipt_url?: string | null
          status?: string | null
          transaction_date?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          business_data: Json | null
          created_at: string
          dealer_data: Json | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          supplier_data: Json | null
          used_at: string | null
        }
        Insert: {
          business_data?: Json | null
          created_at?: string
          dealer_data?: Json | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          supplier_data?: Json | null
          used_at?: string | null
        }
        Update: {
          business_data?: Json | null
          created_at?: string
          dealer_data?: Json | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          supplier_data?: Json | null
          used_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          arrival_date: string | null
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          base_price: number
          category: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_bugun_halde: boolean
          last_modified_at: string | null
          last_modified_by: string | null
          name: string
          origin: string | null
          previous_price: number | null
          price_change: Database["public"]["Enums"]["price_change"] | null
          product_status: string | null
          quality: Database["public"]["Enums"]["quality_grade"] | null
          slug: string
          stock: number | null
          supplier_id: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          updated_at: string
          variants: Json | null
        }
        Insert: {
          arrival_date?: string | null
          availability?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          base_price: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_bugun_halde?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          name: string
          origin?: string | null
          previous_price?: number | null
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_status?: string | null
          quality?: Database["public"]["Enums"]["quality_grade"] | null
          slug: string
          stock?: number | null
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          arrival_date?: string | null
          availability?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_bugun_halde?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          name?: string
          origin?: string | null
          previous_price?: number | null
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_status?: string | null
          quality?: Database["public"]["Enums"]["quality_grade"] | null
          slug?: string
          stock?: number | null
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      region_products: {
        Row: {
          availability_status:
            | Database["public"]["Enums"]["availability_status"]
            | null
          business_price: number | null
          created_at: string
          id: string
          is_active: boolean
          is_available: boolean
          price: number
          price_change: Database["public"]["Enums"]["price_change"] | null
          product_id: string
          quality_grade: Database["public"]["Enums"]["quality_grade"] | null
          region_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          business_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          price: number
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_id: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          region_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          availability_status?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          business_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_available?: boolean
          price?: number
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_id?: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          region_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "region_products_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          delivery_slots: Json | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_slots?: Json | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_slots?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_offers: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          notes: string | null
          product_name: string
          quality_grade: Database["public"]["Enums"]["quality_grade"] | null
          quantity: number
          status: string
          supplier_id: string
          unit: Database["public"]["Enums"]["product_unit"]
          unit_price: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          quantity: number
          status?: string
          supplier_id: string
          unit: Database["public"]["Enums"]["product_unit"]
          unit_price: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"] | null
          quantity?: number
          status?: string
          supplier_id?: string
          unit?: Database["public"]["Enums"]["product_unit"]
          unit_price?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          product_categories: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          product_categories?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_categories?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
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
          role?: Database["public"]["Enums"]["app_role"]
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
      ensure_auth_user_exists: {
        Args: { email_param: string }
        Returns: string
      }
      get_supplier_image_path: {
        Args: { filename: string; supplier_id: string }
        Returns: string
      }
      get_system_setting: { Args: { setting_key: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      test_user_exists: { Args: { p_email: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "superadmin"
        | "dealer"
        | "supplier"
        | "business"
      approval_status: "pending" | "approved" | "rejected"
      availability_status: "plenty" | "limited" | "last"
      price_change: "up" | "down" | "stable"
      product_unit: "kg" | "adet" | "demet" | "paket"
      quality_grade: "premium" | "standart" | "ekonomik"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "admin",
        "user",
        "superadmin",
        "dealer",
        "supplier",
        "business",
      ],
      approval_status: ["pending", "approved", "rejected"],
      availability_status: ["plenty", "limited", "last"],
      price_change: ["up", "down", "stable"],
      product_unit: ["kg", "adet", "demet", "paket"],
      quality_grade: ["premium", "standart", "ekonomik"],
    },
  },
} as const
