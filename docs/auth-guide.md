# Authentication System Guide

This document outlines the implementation details of the authentication system using Supabase and Next.js.

## Key Components

### 1. Environment Variables
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Providers Setup
`app/providers.tsx` wraps the application with AuthProvider:
```tsx
'use client'
import { AuthProvider } from '@/lib/hooks/useAuth'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
```

### 3. Root Layout Integration
`app/layout.tsx` includes the Providers:
```tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### 4. Route Protection
#### Server-side (Middleware)
`middleware.ts` protects routes:
```ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}
```

#### Client-side (ProtectedRouteWrapper)
`components/authentication/protected-route-wrapper.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function ProtectedRouteWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, router])

  return <>{children}</>
}
```

### 5. Auth Hook
`lib/hooks/useAuth.tsx` manages auth state:
```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'

const AuthContext = createContext<{
  session: Session | null
}>({ session: null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### 6. OAuth Callback
`app/auth/callback/route.ts` handles OAuth redirects:
```ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

## Usage

1. Protect pages by wrapping them with ProtectedRouteWrapper
2. Access auth state using useAuth hook
3. Login/Logout using supabase.auth methods
4. Middleware will automatically protect server-side routes

## Troubleshooting

- Ensure environment variables are set correctly
- Verify Supabase project configuration
- Check network requests in browser devtools
- Validate session state in useAuth hook
