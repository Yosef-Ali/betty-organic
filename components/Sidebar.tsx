'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingBag, ShoppingCart, Package, Users2, Users, LineChart, Settings, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Button } from './ui/button'

interface SidebarProps {
  expanded: boolean
  onToggle: (expanded: boolean) => void
  mobileMenuOpen: boolean
  onMobileMenuClose: () => void
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/sales", icon: ShoppingBag, label: "Sales" },
  { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/dashboard/products", icon: Package, label: "Products" },
  { href: "/dashboard/customers", icon: Users2, label: "Customers" },
  { href: "/dashboard/users", icon: Settings, label: "Users" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
]

export default function Sidebar({ expanded, onToggle, mobileMenuOpen, onMobileMenuClose }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    onToggle(!expanded)
  }

  const sidebarContent = (
    <>
      <div className="flex items-center h-16 px-2">
        <Image
          src="/logo.jpeg"
          alt="Betty Organic Logo"
          width={40}
          height={40}
          className="w-10 h-10 object-cover"
        />
        {(expanded || isMobile) && (
          <span className="ml-3 text-lg font-bold whitespace-nowrap overflow-hidden transition-all duration-300">Betty Organic</span>
        )}
        {isMobile && (
          <Button size="icon" variant="ghost" className="ml-auto" onClick={onMobileMenuClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close Menu</span>
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-5 px-2">
        {navItems.map((item) => (
          <SidebarLink key={item.href} {...item} expanded={expanded || isMobile} onClick={isMobile ? onMobileMenuClose : undefined} />
        ))}
      </nav>
      <div className="px-2 py-5">
        <SidebarLink href="/settings" icon={Settings} label="Settings" expanded={expanded || isMobile} onClick={isMobile ? onMobileMenuClose : undefined} />
      </div>
      {!isMobile && <ToggleButton expanded={expanded} onClick={toggleSidebar} />}
    </>
  )

  if (isMobile) {
    return (
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    )
  }

  return (
    <TooltipProvider>
      <aside className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-background border-r transition-all duration-300 ${expanded ? 'w-60' : 'w-14'}`}>
        {sidebarContent}
      </aside>
    </TooltipProvider>
  )
}

interface SidebarLinkProps {
  href: string
  icon: React.ElementType
  label: string
  expanded: boolean
  onClick?: () => void
}

function SidebarLink({ href, icon: Icon, label, expanded, onClick }: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={`flex items-center ${expanded ? 'justify-start px-4' : 'justify-center'} h-10 w-full rounded-md transition-colors hover:bg-accent hover:text-accent-foreground`}
          onClick={onClick}
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
