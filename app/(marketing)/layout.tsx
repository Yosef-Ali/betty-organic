import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
   <>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster />
     </>
  )
}
