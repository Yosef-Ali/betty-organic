import type { Order } from '@/types/order';

export function isSupabaseError(data: unknown): data is { error: true; message: string; code: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'message' in data &&
    'code' in data
  );
}

export function isValidOrder(data: unknown): data is Order {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'created_at' in data &&
    'status' in data &&
    'total_amount' in data
  );
}

export function isValidOrderArray(data: unknown): data is Order[] {
  return Array.isArray(data) && data.every(isValidOrder);
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      system_counters: {
        Row: {
          id: string;
          counter_key: string;
          counter_value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          counter_key: string;
          counter_value: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          counter_key?: string;
          counter_value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // ... (rest of the Database type definition remains the same)
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      update_user_role: {
        Args: {
          user_id: string;
          new_role: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  approved: boolean;
  created_at?: string;
  updated_at?: string;
  image_url?: string;
}
