import '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    from<Table extends keyof Database['public']['Tables']>(
      table: Table
    ): SupabaseQueryBuilder<Database['public']['Tables'][Table]['Row']> & {
      eq(
        column: keyof Database['public']['Tables'][Table]['Row'],
        value: string | number | boolean | null
      ): this
    }
  }
}
