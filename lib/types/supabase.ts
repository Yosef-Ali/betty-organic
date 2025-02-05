export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      about: {
        Row: {
          content: string
          created_at: string
          id: string
          images: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          images?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_content: {
        Row: {
          active: boolean | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          images: Json
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          images?: Json
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          images?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          created_at: string | null
          id: number
          links: Json
          question: string
          response: string
          suggestions: string[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          links: Json
          question: string
          response: string
          suggestions: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          links?: Json
          question?: string
          response?: string
          suggestions?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_profile_id: string | null
          id: string
          profile_id: string
          status: string
          total_amount: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_profile_id?: string | null
          id?: string
          profile_id: string
          status: string
          total_amount: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_profile_id?: string | null
          id?: string
          profile_id?: string
          status?: string
          total_amount?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_profile_id_fkey"
            columns: ["customer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_by: string | null
          createdat: string | null
          description: string | null
          id: string
          imageUrl: string | null
          name: string
          price: number
          stock: number | null
          totalsales: number | null
          unit: string | null
          updatedat: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_by?: string | null
          createdat?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          name: string
          price: number
          stock?: number | null
          totalsales?: number | null
          unit?: string | null
          updatedat?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_by?: string | null
          createdat?: string | null
          description?: string | null
          id?: string
          imageUrl?: string | null
          name?: string
          price?: number
          stock?: number | null
          totalsales?: number | null
          unit?: string | null
          updatedat?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          auth_provider: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean | null
          author: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          rating: number | null
          role: string
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          author: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          rating?: number | null
          role: string
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          author?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          rating?: number | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      update_user_role: {
        Args: {
          user_id: string
          new_role: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
