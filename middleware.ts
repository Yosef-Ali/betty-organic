import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // First, handle Supabase session management
  const response = await updateSession(request)
  
  // If the response is a redirect (e.g., to login page), return it
  if (response.status !== 200) {
    return response
  }

  // Add any additional middleware logic here if needed
  // For example, protecting specific routes or adding headers
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - .*\\.(?:svg|png|jpg|jpeg|gif|webp)$ (static image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
