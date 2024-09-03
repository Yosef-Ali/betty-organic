'use client'

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingBag, ShoppingCart, Package, Users2, LineChart, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  onToggle: (expanded: boolean) => void
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/sales", icon: ShoppingBag, label: "Sales" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/customers", icon: Users2, label: "Customers" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
]

export default function Sidebar({ onToggle }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)

  const toggleSidebar = () => {
    setExpanded(!expanded)
    onToggle(!expanded)
  }

  return (
    <TooltipProvider>
      <aside className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-background border-r transition-all duration-300 ${expanded ? 'w-60' : 'w-14'}`}>
        <div className="flex items-center h-16 px-2">
          <Image
            src="/logo.jpeg"
            alt="Betty Organic Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-cover"
          />
          {expanded && (
            <span className="ml-3 text-lg font-bold whitespace-nowrap overflow-hidden transition-all duration-300">Betty Organic</span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-5 px-2">
          {navItems.map((item) => (
            <SidebarLink key={item.href} {...item} expanded={expanded} />
          ))}
        </nav>
        <div className="px-2 py-5">
          <SidebarLink href="/settings" icon={Settings} label="Settings" expanded={expanded} />
        </div>
        <ToggleButton expanded={expanded} onClick={toggleSidebar} />
      </aside>
    </TooltipProvider>
  )
}

interface SidebarLinkProps {
  href: string
  icon: React.ElementType
  label: string
  expanded: boolean
}

function SidebarLink({ href, icon: Icon, label, expanded }: SidebarLinkProps) {

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={`flex items-center ${expanded ? 'justify-start px-4' : 'justify-center'} h-10 w-full rounded-md transition-colors hover:bg-accent hover:text-accent-foreground`}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {expanded && <span className="ml-3 text-sm">{label}</span>}
        </Link>
      </TooltipTrigger>
      {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  )
}

interface ToggleButtonProps {
  expanded: boolean
  onClick: () => void
}

function ToggleButton({ expanded, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-3 bottom-24 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-300 hover:scale-110"

    >
      {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  )
}