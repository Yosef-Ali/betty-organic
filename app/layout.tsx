import { cn } from '@/lib/utils'
import './globals.css'
import { Inter } from 'next/font/google'

export const metadata = {
  metadataBase: new URL('https://postgres-prisma.vercel.app'),
  title: 'Betty Organic vegetable delivery app',
  description:
    'Organic vegetable delivery app ',
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={cn
          (
            "min-h-screen bg-background font-sans antialiased",
            inter.variable
          )}
      >{children}</body>
    </html>
  )
}
