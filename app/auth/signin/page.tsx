// app/auth/signin/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SignInForm from './SignInForm'

export default async function SignInPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/fruits/orange.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" /> {/* Increased opacity from bg-black/50 to bg-black/60 */}

      {/* Content */}
      <div className="z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Betty Organic Admin
        </h2>
      </div>
      <div className="z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignInForm />
      </div>
    </div>
  )
}
