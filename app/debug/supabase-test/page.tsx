'use client';

import { SupabaseConnectionTest } from '@/components/debug/SupabaseConnectionTest';

export default function SupabaseTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Tester</h1>
      <p className="mb-6">
        Use this page to directly test your Supabase connection with different keys.
        Copy and paste your Supabase service role key from your project dashboard to test admin access.
      </p>

      <div className="max-w-3xl mx-auto">
        <SupabaseConnectionTest />
      </div>
    </div>
  );
}
