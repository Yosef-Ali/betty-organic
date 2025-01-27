'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  ShoppingCart,
  Package,
  Users2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  UserPen,
  LayoutDashboard,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Button } from './ui/button';

interface SidebarProps {
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  role?: string;
}

export default function Sidebar({
  expanded,
  onToggle,
  mobileMenuOpen,
  onMobileMenuClose,
  role,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const baseItems = [
    {
      label: 'Profile',
      icon: <UserPen className="h-4 w-4" />,
      href: '/dashboard/profile',
    },
  ];

  const salesItems = [
    {
      label: 'Sales',
      icon: <ShoppingBag className="h-4 w-4" />,
      href: '/dashboard/sales',
    },
    {
      label: 'Orders',
      icon: <ShoppingCart className="h-4 w-4" />,
      href: '/dashboard/orders',
    },
    {
      label: 'Products',
      icon: <Package className="h-4 w-4" />,
      href: '/dashboard/products',
    },
  ];

  const adminItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: '/dashboard',
    },
    ...salesItems,
    {
      label: 'Customers',
      icon: <Users2 className="h-4 w-4" />,
      href: '/dashboard/customers',
    },
    {
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      href: '/dashboard/users',
    },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      href: '/dashboard/settings',
    },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [...baseItems, ...adminItems];
      case 'sales':
        return [...baseItems, ...salesItems];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();
  const isCustomer = role === 'customer';

  const toggleSidebar = () => {
    onToggle(!expanded);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center h-16 px-2">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpeg"
            alt="Betty Organic Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-cover cursor-pointer"
          />
          {(expanded || isMobile || isCustomer) && (
            <span className="ml-3 text-lg font-bold whitespace-nowrap overflow-hidden transition-all duration-300">
              Betty Organic
            </span>
          )}
        </Link>
        {isMobile && (
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            onClick={onMobileMenuClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close Menu</span>
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-5 px-2">
        {navItems.map(item => (
          <SidebarLink
            key={item.href}
            {...item}
            expanded={expanded || isMobile || isCustomer}
            onClick={isMobile ? onMobileMenuClose : undefined}
          />
        ))}
      </nav>
      <div className="px-2 py-5"></div>
      {!isMobile && !isCustomer && (
        <ToggleButton expanded={expanded} onClick={toggleSidebar} />
      )}
    </>
  );

  const wrappedContent = (
    <TooltipProvider>
      <aside
        className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-background border-r ${
          isCustomer
            ? 'w-60'
            : `transition-all duration-300 ${expanded ? 'w-60' : 'w-14'}`
        }`}
      >
        {sidebarContent}
      </aside>
    </TooltipProvider>
  );

  if (isMobile) {
    return (
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    );
  }

  return wrappedContent;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onClick?: () => void;
}

function SidebarLink({
  href,
  icon,
  label,
  expanded,
  onClick,
}: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={`flex items-center ${
            expanded ? 'justify-start px-4' : 'justify-center'
          } h-10 w-full rounded-md transition-colors hover:bg-accent hover:text-accent-foreground`}
          onClick={onClick}
        >
          {icon}
          {expanded && <span className="ml-3 text-sm">{label}</span>}
        </Link>
      </TooltipTrigger>
      {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}

interface ToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
}

function ToggleButton({ expanded, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-3 bottom-24 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-300 hover:scale-110"
    >
      {expanded ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </button>
  );
}
