"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ShoppingCart, LayoutDashboard } from "lucide-react";
import Image from 'next/image';

interface NavigationProps {
  isAdmin: boolean;
}

export function Navigation({ isAdmin }: NavigationProps) {

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold relative group flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image
              src="/logo.jpeg"
              alt="Betty's Organic Logo"
              fill
              className="rounded-full object-cover"
              sizes="40px"
            />
          </div>
          <span className="relative z-10">Betty&apos;s Organic</span>
          <div className="absolute -bottom-2 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNGMxMCAwIDEwIDQgMjAgNHMxMC00IDIwLTQgMTAgNCAyMCA0IDEwLTQgMjAtNCAxMCA0IDIwIDQgMTAtNCAyMC00IiBzdHJva2U9IiNlNjVmMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==')] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0 bg-repeat-x" />
        </Link>

        <div className="hidden space-x-6 md:flex items-center">
          <Link href="/" className="text-lg font-medium relative group">
            <span className="relative z-10">Home</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link href="/products" className="text-lg font-medium relative group">
            <span className="relative z-10">Products</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link href="/about" className="text-lg font-medium relative group">
            <span className="relative z-10">About</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          <Link href="/contact" className="text-lg font-medium relative group">
            <span className="relative z-10">Contact</span>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {isAdmin && (
            <Link href="/dashboard" className="text-lg font-medium relative group">
              <Button variant="ghost" className="gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Button>
            </Link>
          )}

          <Button size="icon" variant="ghost">
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
