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
    };
  };
}
