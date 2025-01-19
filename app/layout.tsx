import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import './globals.css'
import { Inter } from 'next/font/google'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from './providers'
import { AuthProvider } from '@/contexts/auth/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Betty Organic',
  description: 'Organic products and delivery services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <TooltipProvider>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}
