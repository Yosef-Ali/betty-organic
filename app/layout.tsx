import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import './globals.css'
import { Inter } from 'next/font/google'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from '@/components/SessionProvider'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Betty Organic',
  description: 'Organic products and delivery services',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create the Supabase client with proper cookie store
  const supabase = createServerComponentClient({
    cookies: cookies
  })

  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
