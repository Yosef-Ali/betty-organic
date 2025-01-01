// app/components/marketing/MarketingLayout.tsx

import Footer from "@/components/Footer"
import Header from "@/components/Header"


export default function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  const handleMobileMenuToggle = () => {
    // Handle mobile menu toggle logic here
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMobileMenuToggle={handleMobileMenuToggle} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
