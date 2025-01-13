import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import Providers from '../providers'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster />
    </Providers>
  )
}
