export function getSupabaseProjectRef() {
  const envRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  if (envRef) return envRef;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'Either NEXT_PUBLIC_SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL must be set',
    );
  }

  const matches = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/);
  if (!matches?.[1]) {
    throw new Error(
      'Invalid Supabase URL format. Expected: https://<project-ref>.supabase.co',
    );
  }

  return matches[1];
}
