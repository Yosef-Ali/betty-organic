import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Betty Organic",
  description: "Betty Organic - Local Natural Products",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
