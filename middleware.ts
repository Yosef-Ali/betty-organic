import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the response
          // This will refresh the session if needed.
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    // Handle server action requests specially
    if (req.url.includes('server-action') || req.method === 'POST') {
      // Check if this is a server action request by examining headers or path
      const isServerAction = req.headers.get('x-action') || req.url.includes('_action');

      if (isServerAction) {
        // For server actions, we want to add additional error handling
        // but still let the request through even if auth refresh fails
        try {
          await supabase.auth.getSession();
        } catch (authError) {
          console.error('Auth error in server action middleware:', authError);
          // Continue with the request even if auth refresh fails for server actions
        }

        // Allow the request through to be handled by the action handler
        return response;
      }
    }

    // Regular auth refresh for non-server action requests
    await supabase.auth.getSession();

    // Refresh session if expired - important!
    await supabase.auth.getUser();

    return response;
  } catch (e) {
    // Global error handler for middleware
    console.error('Middleware error:', e);

    // Return a more graceful error response instead of crashing
    if (req.headers.get('accept')?.includes('application/json')) {
      // Return JSON error for API requests
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'The server encountered an error processing your request'
        },
        { status: 500 }
      );
    }

    // For HTML requests, allow the request through and let the error boundary handle it
    // If an error occurs, continue to the requested page and let the client handle it
    return response;
  }
}

// Only run middleware on matching pages
export const config = {
  matcher: [
    // Match all routes except public assets, API routes that don't need auth, and static files
    '/((?!_next/static|_next/image|favicon.ico|public/|api/public).*)',
  ],
};
