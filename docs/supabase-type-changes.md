# Supabase Client Type Modifications

## Problem
The current Supabase client types are too strict for simple ID filters, requiring workarounds like `as any`.

## Proposed Solution
Create a type extension file `types/supabase-extension.d.ts` with the following content:

```typescript
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
```

## Implementation Steps
1. Create the type extension file in Code mode
2. Update tsconfig.json to include the new types
3. Test with various query patterns
4. Remove any existing `as any` workarounds

## Testing Plan
- Verify simple ID filters work without type errors
- Ensure complex filters still maintain type safety
- Check all existing queries still compile
