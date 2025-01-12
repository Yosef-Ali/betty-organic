"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface MobileMenuProps {
  session: any // Replace 'any' with your actual session type
}

export function MobileMenu({ session }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: "#hero", label: "Home" },
    { href: "#products", label: "Products" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ]

  if (session) {
    links.push({ href: "/dashboard", label: "Dashboard" })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col space-y-4 mt-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {/* <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </Button> */}
      </SheetContent>
    </Sheet>
  )
}

