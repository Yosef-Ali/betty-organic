# Next.js + Supabase Integration Guide with Role-Based Auth

## Table of Contents

1. [Project Structure](#project-structure)
2. [Authentication System](#authentication-system)
3. [Role-Based Navigation](#role-based-navigation)
4. [Cart System](#cart-system)
5. [Database Schema](#database-schema)
6. [Implementation Steps](#implementation-steps)

## Project Structure

```
app/
├─ (marketing)/               # Public routes
│  ├─ layout.tsx             # Marketing layout with navbar
│  ├─ page.tsx               # Landing page
│  ├─ products/
│  │  └─ page.tsx           # Product listing
│  ├─ signin/
│  │  └─ page.tsx           # Login page
│  └─ signup/
│     └─ page.tsx           # Registration page
├─ (dashboard)/              # Protected routes
│  ├─ layout.tsx            # Dashboard layout with sidebar
│  ├─ page.tsx              # Dashboard home
│  ├─ profile/              # User profile
│  ├─ orders/               # Order management
│  ├─ sales/                # Sales dashboard (Admin/Sales)
│  ├─ users/                # User management (Admin)
│  ├─ products/             # Product management (Admin)
│  └─ settings/             # App settings
└─ auth/
   └─ callback/
      └─ route.ts           # Auth callback handler

components/
├─ marketing/
│  └─ Navbar.tsx            # Public navigation
├─ dashboard/
│  ├─ Sidebar.tsx          # Role-based admin navigation
│  └─ UserButton.tsx       # User menu component
└─ cart/
   ├─ CartSheet.tsx        # Shopping cart sheet
   ├─ CartItems.tsx        # Cart items display
   └─ CartActions.tsx      # Role-specific cart actions
```

## Authentication System

### Types Definition (types/auth.ts)

```typescript
export type UserRole = 'admin' | 'sales' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  status: 'active' | 'inactive';
}
```

### Auth Utilities (lib/auth.ts)

```typescript
import { createClient } from '@/utils/supabase/server';
import { UserProfile } from '@/types/auth';

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { user: session.user, profile: profile as UserProfile };
}

export async function isAdmin() {
  const { profile } = await getCurrentUser();
  return profile?.role === 'admin';
}

export async function isSales() {
  const { profile } = await getCurrentUser();
  return profile?.role === 'sales' || profile?.role === 'admin';
}

export async function isCustomer() {
  const { profile } = await getCurrentUser();
  return profile?.role === 'customer';
}
```

### Auth Context (contexts/auth/AuthContext.tsx)

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSales: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  signOut: async () => {},
  isAdmin: false,
  isSales: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch user profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const value = {
    user,
    profile,
    signOut,
    isAdmin: profile?.role === 'admin',
    isSales: profile?.role === 'sales' || profile?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Role-Based Navigation

### Marketing Navbar (components/marketing/Navbar.tsx)

```typescript
import { getCurrentUser } from '@/lib/auth';
import { CartSheet } from '@/components/cart/CartSheet';
import { UserButton } from '@/components/dashboard/UserButton';

export async function Navbar() {
  const { user, profile } = await getCurrentUser();
  const isAdminOrSales = profile?.role === 'admin' || profile?.role === 'sales';

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <nav className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold">
            Betty Organic
          </a>
          <a href="/products">Products</a>
          {isAdminOrSales && <a href="/dashboard">Dashboard</a>}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <CartSheet user={user} userProfile={profile} />
              <UserButton user={user} profile={profile} />
            </>
          ) : (
            <>
              <a href="/signin">Sign In</a>
              <a href="/signup" className="btn-primary">
                Sign Up
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Dashboard Sidebar (components/dashboard/Sidebar.tsx)

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/auth';

interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    roles: ['admin', 'sales', 'customer'],
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    roles: ['admin', 'sales', 'customer'],
  },
  {
    href: '/dashboard/orders',
    label: 'Orders',
    roles: ['admin', 'sales', 'customer'],
  },
  { href: '/dashboard/sales', label: 'Sales', roles: ['admin', 'sales'] },
  { href: '/dashboard/users', label: 'Users', roles: ['admin'] },
  { href: '/dashboard/products', label: 'Products', roles: ['admin'] },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    roles: ['admin', 'sales', 'customer'],
  },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const filteredNav = navigation.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-gray-50 min-h-screen">
      <nav className="p-4 space-y-2">
        {filteredNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-md transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

## Cart System

### Cart Sheet Component (components/cart/CartSheet.tsx)

```typescript
'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CartItems } from './CartItems';
import { CartActions } from './CartActions';
import type { UserProfile } from '@/types/auth';
import { useCartStore } from '@/store/cartStore';

interface CartSheetProps {
  user: any;
  userProfile: UserProfile | null;
}

export function CartSheet({ user, userProfile }: CartSheetProps) {
  const isAdminOrSales =
    userProfile?.role === 'admin' || userProfile?.role === 'sales';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative">
          <CartIcon />
          <CartBadge />
        </button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col h-full">
          <CartItems />
          {isAdminOrSales ? (
            <SalesCartActions user={user} />
          ) : (
            <CustomerCartActions user={user} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SalesCartActions({ user }: { user: any }) {
  const cart = useCartStore();

  const handleProcessSale = async () => {
    // Special handling for in-store sales
    // - Apply staff discounts
    // - Process immediate payment
    // - Record sale with staff ID
  };

  return (
    <div className="mt-auto p-4 border-t">
      {/* Sales staff specific actions */}
      <button onClick={handleProcessSale} className="w-full btn-primary">
        Process Sale
      </button>
    </div>
  );
}

function CustomerCartActions({ user }: { user: any }) {
  const cart = useCartStore();

  const handleCheckout = async () => {
    // Regular customer checkout flow
    // - Create order
    // - Handle online payment
    // - Process shipping details
  };

  return (
    <div className="mt-auto p-4 border-t">
      {/* Customer specific actions */}
      <button onClick={handleCheckout} className="w-full btn-primary">
        Checkout
      </button>
    </div>
  );
}
```

## Database Schema

```sql
-- Create enum for user roles
create type user_role as enum ('admin', 'sales', 'customer');

-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  role user_role not null default 'customer',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  stock_quantity integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders table
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  status text not null default 'pending',
  total decimal(10,2) not null,
  created_by uuid references auth.users not null, -- For tracking if created by staff
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items table
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders not null,
  product_id uuid references products not null,
  quantity integer not null,
  price decimal(10,2) not null,
  created_at timestamptz default now()
);

-- RLS Policies

-- Profiles policies
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admin can manage all profiles"
  on profiles for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Sales can view profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'sales')
    )
  );

-- Orders policies
alter table orders enable row level security;

create policy "Customers can view own orders"
  on orders for select
  using (user_id = auth.uid());

create policy "Customers can create orders"
  on orders for insert
  with check (user_id = auth.uid());

create policy "Admin and sales can manage orders"
  on orders for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'sales')
    )
  );

-- Products policies
alter table products enable row level security;

create policy "Anyone can view products"
  on products for select
  using (true);

create policy "Admin can manage products"
  on products for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
```

## Implementation Steps

1. **Setup Authentication**

   - Configure Supabase auth
   - Create sign in/sign up pages
   - Implement auth callback handler
   - Set up auth context provider

2. **Database Setup**
   - Create required tables
   - Configure RLS policies
