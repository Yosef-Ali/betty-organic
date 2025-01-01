// app/(dashboard)/layout.tsx
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Database } from '@/lib/supabase/database.types';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return redirect('/auth/signin')
    }

    // Refresh the session if it's close to expiring
    if (session.expires_at) {
      const timeNow = Math.floor(Date.now() / 1000)
      const expiresIn = session.expires_at - timeNow
      if (expiresIn < 3600) { // Less than 1 hour left
        const { data: { session: newSession } } = await supabase.auth.refreshSession()
        if (!newSession) {
          return redirect('/auth/signin')
        }
      }
    }

    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader user={session.user} />
        {children}
      </div>
    );
  } catch (err) {
    console.error('Session error:', err)
    return redirect('/auth/signin')
  }
}
