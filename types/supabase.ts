export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'customer' | 'sales';
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'customer' | 'sales';
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'customer' | 'sales';
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          imageUrl: string;
          createdAt: string;
          updatedAt: string;
          totalSales?: number;
          unit: string | null;  // Changed this line to make unit nullable
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          imageUrl: string;
          createdAt?: string;
          updatedAt?: string;
          totalSales?: number;
          unit?: string | null;  // Added unit field
        };
        Update: {
          name?: string;
          description?: string;
          price?: number;
          stock?: number;
          imageUrl?: string;
          updatedAt?: string;
          totalSales?: number;
          unit?: string | null;  // Added unit field
        };
      };
    };
  };
}

// types/supabase.ts
export type UserRole = 'admin' | 'sales' | 'customer'

export interface UserMetadata {
  role: UserRole
}

declare module '@supabase/supabase-js' {
  interface UserMetadata {
    role: UserRole
  }
}
