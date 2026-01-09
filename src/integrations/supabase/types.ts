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
      deleted_test_accounts_backup_20250109: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          roles: Database["public"]["Enums"]["app_role"][] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          roles?: Database["public"]["Enums"]["app_role"][] | null
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
          customer_name: string | null
          customer_phone: string | null
          dealer_id: string | null
          delivered_at: string | null
          delivery_address: Json | null
          delivery_notes: string | null
          delivery_photo_url: string | null
          delivery_slot: Json | null
          estimated_delivery_time: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string | null
          payment_method: string | null
          payment_method_details: Json | null
          payment_notes: string | null
          payment_status: string | null
          placed_at: string | null
          prepared_at: string | null
          region_id: string | null
          shipping_address: Json | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          dealer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          delivery_slot?: Json | null
          estimated_delivery_time?: string | null
          id?: string
          items: Json
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_notes?: string | null
          payment_status?: string | null
          placed_at?: string | null
          prepared_at?: string | null
          region_id?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          dealer_id?: string | null
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_notes?: string | null
          delivery_photo_url?: string | null
          delivery_slot?: Json | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          payment_notes?: string | null
          payment_status?: string | null
          placed_at?: string | null
          prepared_at?: string | null
          region_id?: string | null
          shipping_address?: Json | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      product_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          errors: Json | null
          failed_rows: number
          file_name: string
          file_size: number
          id: string
          status: string
          successful_rows: number
          supplier_id: string
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          failed_rows?: number
          file_name: string
          file_size: number
          id?: string
          status?: string
          successful_rows?: number
          supplier_id: string
          total_rows: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          failed_rows?: number
          file_name?: string
          file_size?: number
          id?: string
          status?: string
          successful_rows?: number
          supplier_id?: string
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_imports_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "product_imports_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "product_imports_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          metadata: Json | null
          product_id: string
          variation_type: Database["public"]["Enums"]["product_variation_type"]
          variation_value: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          metadata?: Json | null
          product_id: string
          variation_type: Database["public"]["Enums"]["product_variation_type"]
          variation_value: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          metadata?: Json | null
          product_id?: string
          variation_type?: Database["public"]["Enums"]["product_variation_type"]
          variation_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "landing_page_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          arrival_date: string | null
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          base_price: number
          category: string
          conversion_factor: number | null
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
          price: number | null
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
          conversion_factor?: number | null
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
          price?: number | null
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
          conversion_factor?: number | null
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
          price?: number | null
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
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["supplier_id"]
          },
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
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
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
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_offers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["supplier_id"]
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
      supplier_product_variations: {
        Row: {
          created_at: string
          id: string
          price_adjustment: number | null
          stock_quantity: number | null
          supplier_product_id: string
          supplier_variation_sku: string | null
          updated_at: string
          variation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price_adjustment?: number | null
          stock_quantity?: number | null
          supplier_product_id: string
          supplier_variation_sku?: string | null
          updated_at?: string
          variation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price_adjustment?: number | null
          stock_quantity?: number | null
          supplier_product_id?: string
          supplier_variation_sku?: string | null
          updated_at?: string
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_variations_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_variations_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          created_at: string
          delivery_days: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          last_price_update: string | null
          min_order_quantity: number | null
          origin: string | null
          previous_price: number | null
          price: number
          price_change: Database["public"]["Enums"]["price_change"] | null
          product_id: string
          quality: Database["public"]["Enums"]["quality_grade"] | null
          stock_quantity: number
          supplier_id: string
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          availability?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          last_price_update?: string | null
          min_order_quantity?: number | null
          origin?: string | null
          previous_price?: number | null
          price: number
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_id: string
          quality?: Database["public"]["Enums"]["quality_grade"] | null
          stock_quantity?: number
          supplier_id: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          availability?:
            | Database["public"]["Enums"]["availability_status"]
            | null
          created_at?: string
          delivery_days?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          last_price_update?: string | null
          min_order_quantity?: number | null
          origin?: string | null
          previous_price?: number | null
          price?: number
          price_change?: Database["public"]["Enums"]["price_change"] | null
          product_id?: string
          quality?: Database["public"]["Enums"]["quality_grade"] | null
          stock_quantity?: number
          supplier_id?: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "landing_page_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "bugun_halde_comparison"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_catalog_with_variations"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
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
      vendors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      warehouse_staff: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          user_id: string
          vendor_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          is_active?: boolean | null
          user_id: string
          vendor_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          is_active?: boolean | null
          user_id?: string
          vendor_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_staff_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelist_applications: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          id: string
          ip_address: string | null
          notes: string | null
          phone: string
          source: string | null
          status: string | null
          updated_at: string
          user_agent: string | null
          user_type: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          phone: string
          source?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          user_type?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      bugun_halde_comparison: {
        Row: {
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          category: string | null
          delivery_days: number | null
          image_url: string | null
          is_featured: boolean | null
          is_lowest_price: boolean | null
          market_avg_price: number | null
          market_max_price: number | null
          market_min_price: number | null
          previous_price: number | null
          price: number | null
          price_change: Database["public"]["Enums"]["price_change"] | null
          product_id: string | null
          product_name: string | null
          quality: Database["public"]["Enums"]["quality_grade"] | null
          stock_quantity: number | null
          supplier_id: string | null
          supplier_name: string | null
          total_suppliers: number | null
          unit: Database["public"]["Enums"]["product_unit"] | null
        }
        Relationships: []
      }
      landing_page_data: {
        Row: {
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          base_price: number | null
          category: string | null
          id: string | null
          images: string[] | null
          name: string | null
          origin: string | null
          quality: Database["public"]["Enums"]["quality_grade"] | null
          slug: string | null
          unit: Database["public"]["Enums"]["product_unit"] | null
        }
        Relationships: []
      }
      supplier_catalog_with_variations: {
        Row: {
          availability:
            | Database["public"]["Enums"]["availability_status"]
            | null
          category: string | null
          is_featured: boolean | null
          price: number | null
          product_id: string | null
          product_name: string | null
          stock_quantity: number | null
          supplier_id: string | null
          supplier_name: string | null
          unit: Database["public"]["Enums"]["product_unit"] | null
          variations: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      ensure_auth_user_exists: {
        Args: { email_param: string }
        Returns: string
      }
      get_product_price_stats: {
        Args: { p_product_id: string }
        Returns: {
          avg_price: number
          max_price: number
          min_price: number
          supplier_count: number
        }[]
      }
      get_product_suppliers: {
        Args: { p_product_id: string }
        Returns: {
          availability: Database["public"]["Enums"]["availability_status"]
          delivery_days: number
          is_featured: boolean
          previous_price: number
          price: number
          price_change: Database["public"]["Enums"]["price_change"]
          quality: Database["public"]["Enums"]["quality_grade"]
          stock_quantity: number
          supplier_id: string
          supplier_name: string
        }[]
      }
      get_product_variations: {
        Args: { p_product_id: string }
        Returns: {
          display_order: number
          metadata: Json
          variation_type: Database["public"]["Enums"]["product_variation_type"]
          variation_value: string
        }[]
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
      log_security_event: {
        Args: {
          p_action: string
          p_new_data: Json
          p_old_data: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      search_supplier_products: {
        Args: {
          p_max_price?: number
          p_min_price?: number
          p_search_text?: string
          p_supplier_id: string
          p_variation_types?: Database["public"]["Enums"]["product_variation_type"][]
        }
        Returns: {
          availability: Database["public"]["Enums"]["availability_status"]
          product_id: string
          product_name: string
          supplier_price: number
          variations: Json
        }[]
      }
      test_user_exists: { Args: { p_email: string }; Returns: boolean }
      warehouse_get_orders: {
        Args: { p_window_end: string; p_window_start: string }
        Returns: {
          customer_name: string
          customer_phone: string
          delivery_address: Json
          id: string
          items: Json
          order_number: string
          placed_at: string
          status: string
        }[]
      }
      warehouse_get_picking_list: {
        Args: { p_window_end: string; p_window_start: string }
        Returns: {
          order_count: number
          product_id: string
          product_name: string
          total_quantity_kg: number
        }[]
      }
      warehouse_mark_prepared: {
        Args: { p_order_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "superadmin"
        | "dealer"
        | "supplier"
        | "business"
        | "warehouse_manager"
      approval_status: "pending" | "approved" | "rejected"
      availability_status: "plenty" | "limited" | "last"
      price_change: "up" | "down" | "stable"
      product_unit: "kg" | "adet" | "demet" | "paket"
      product_variation_type:
        | "size"
        | "type"
        | "scent"
        | "packaging"
        | "material"
        | "flavor"
        | "other"
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
      app_role: [
        "admin",
        "user",
        "superadmin",
        "dealer",
        "supplier",
        "business",
        "warehouse_manager",
      ],
      approval_status: ["pending", "approved", "rejected"],
      availability_status: ["plenty", "limited", "last"],
      price_change: ["up", "down", "stable"],
      product_unit: ["kg", "adet", "demet", "paket"],
      product_variation_type: [
        "size",
        "type",
        "scent",
        "packaging",
        "material",
        "flavor",
        "other",
      ],
      quality_grade: ["premium", "standart", "ekonomik"],
    },
  },
} as const
