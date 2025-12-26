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
  public: {
    Tables: {
      dealers: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          region_ids: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          region_ids?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          region_ids?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          notes: string | null
          region_id: string | null
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          notes?: string | null
          region_id?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
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
      pending_invites: {
        Row: {
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
          availability: Database["public"]["Enums"]["availability_status"]
          category_id: string
          category_name: string
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_active: boolean
          is_bugun_halde: boolean
          name: string
          origin: string
          previous_price: number | null
          price: number
          price_change: Database["public"]["Enums"]["price_change"]
          quality: Database["public"]["Enums"]["quality_grade"]
          slug: string
          unit: Database["public"]["Enums"]["product_unit"]
          updated_at: string
          variants: Json | null
        }
        Insert: {
          arrival_date?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          category_id: string
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_bugun_halde?: boolean
          name: string
          origin: string
          previous_price?: number | null
          price: number
          price_change?: Database["public"]["Enums"]["price_change"]
          quality?: Database["public"]["Enums"]["quality_grade"]
          slug: string
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          arrival_date?: string | null
          availability?: Database["public"]["Enums"]["availability_status"]
          category_id?: string
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_bugun_halde?: boolean
          name?: string
          origin?: string
          previous_price?: number | null
          price?: number
          price_change?: Database["public"]["Enums"]["price_change"]
          quality?: Database["public"]["Enums"]["quality_grade"]
          slug?: string
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          variants?: Json | null
        }
        Relationships: []
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
          availability: Database["public"]["Enums"]["availability_status"]
          created_at: string
          id: string
          is_active: boolean
          previous_price: number | null
          price: number
          price_change: Database["public"]["Enums"]["price_change"]
          product_id: string
          region_id: string
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_status"]
          created_at?: string
          id?: string
          is_active?: boolean
          previous_price?: number | null
          price: number
          price_change?: Database["public"]["Enums"]["price_change"]
          product_id: string
          region_id: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_status"]
          created_at?: string
          id?: string
          is_active?: boolean
          previous_price?: number | null
          price?: number
          price_change?: Database["public"]["Enums"]["price_change"]
          product_id?: string
          region_id?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "region_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          delivery_fee: number
          delivery_slots: Json | null
          description: string | null
          districts: string[]
          free_delivery_threshold: number | null
          id: string
          is_active: boolean
          min_order_amount: number
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
          warehouse_address: string | null
          warehouse_phone: string | null
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          delivery_slots?: Json | null
          description?: string | null
          districts?: string[]
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean
          min_order_amount?: number
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          warehouse_address?: string | null
          warehouse_phone?: string | null
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          delivery_slots?: Json | null
          description?: string | null
          districts?: string[]
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean
          min_order_amount?: number
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          warehouse_address?: string | null
          warehouse_phone?: string | null
        }
        Relationships: []
      }
      supplier_offers: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          offered_price: number
          offered_quantity: number
          product_id: string
          status: string
          supplier_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          offered_price: number
          offered_quantity: number
          product_id: string
          status?: string
          supplier_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          offered_price?: number
          offered_quantity?: number
          product_id?: string
          status?: string
          supplier_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "superadmin" | "dealer" | "supplier"
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
  public: {
    Enums: {
      app_role: ["admin", "user", "superadmin", "dealer", "supplier"],
      availability_status: ["plenty", "limited", "last"],
      price_change: ["up", "down", "stable"],
      product_unit: ["kg", "adet", "demet", "paket"],
      quality_grade: ["premium", "standart", "ekonomik"],
    },
  },
} as const
