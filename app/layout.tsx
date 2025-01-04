import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import './globals.css'
import { Inter } from 'next/font/google'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import Providers from './providers'
import { SessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'Betty Organic',
  description: 'Organic products and delivery services',
}

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <Providers>
          <SessionProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <Toaster />
          </SessionProvider>
        </Providers>
      </body>
    </html>
  )
}
