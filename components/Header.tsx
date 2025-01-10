import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, PanelLeft } from "lucide-react";
import { Button, buttonVariants } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client
import { Home, ShoppingBag, ShoppingCart, Package, Users2, LineChart } from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

// Extend the Supabase User type to include avatar_url in user_metadata
interface User extends SupabaseUser {
  user_metadata: {
    avatar_url: string;
  };
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/sales", icon: ShoppingBag, label: "Sales" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/customers", icon: Users2, label: "Customers" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
];

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [clientPathname, setClientPathname] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as User); // Cast the user to the extended User type
    };

    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const generateBreadcrumbs = () => {
    if (!clientPathname || typeof clientPathname !== 'string') {
      return ['Dashboard'];
    }

    const rawSegments = clientPathname.split('/').filter(Boolean);
    const pathSegments = rawSegments.map(segment => segment.replace(/-/g, ' '));

    if (pathSegments.length === 0) {
      return ['Dashboard'];
    }

    return pathSegments.map((segment, index) => {
      // Ensure the first segment (dashboard) is always lowercase in href
      const hrefSegments = rawSegments.slice(0, index + 1);
      if (index === 0 && hrefSegments[0].toLowerCase() === 'dashboard') {
        hrefSegments[0] = 'dashboard';
      }
      const href = '/' + hrefSegments.join('/');

      const label = navItems.find(item => item.href === href)?.label ||
        segment
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      return label;
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:p-6"> {/* Added /80 for opacity */}
      <Button size="icon" variant="outline" className="sm:hidden" onClick={onMobileMenuToggle}>
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <Breadcrumb pathSegments={generateBreadcrumbs()} />
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      {user && (
        <Link href="/dashboard" className={buttonVariants()}>
          Dashboard
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            {user ? (
              <Image
                src={user.user_metadata.avatar_url || "/placeholder-user.webp"}
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
              />
            ) : (
              <Image
                src="/placeholder-user.webp"
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
