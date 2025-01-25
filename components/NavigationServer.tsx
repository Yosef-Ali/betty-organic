import { createClient } from '@/lib/supabase/server';
import { NavigationClient } from './NavigationClient';

export default async function NavigationServer() {
  const supabase = await createClient();

  try {
    // Get initial session and profile
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    let profile = null;
    if (sessionData?.session?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else {
        profile = profileData;
      }
    }

    console.log('Server navigation session:', {
      hasSession: !!sessionData?.session,
      userId: sessionData?.session?.user?.id?.substring(0, 6),
      role: profile?.role || 'none',
    });

    return (
      <NavigationClient
        initialSession={sessionData?.session}
        initialProfile={profile}
      />
    );
  } catch (error) {
    console.error('NavigationServer error:', error);
    return (
      <div className="text-red-500 p-4">
        Navigation Error: {(error as Error).message}
      </div>
    );
  }
}
