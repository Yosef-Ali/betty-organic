import { createClient } from '@/lib/supabase/server';
import { NavigationClient } from './NavigationClient';

export default async function NavigationServer() {
  const supabase = await createClient();

  // Get initial session and profile
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let profile = null;
  if (session?.user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    profile = data;
  }

  return <NavigationClient initialSession={session} initialProfile={profile} />;
}
