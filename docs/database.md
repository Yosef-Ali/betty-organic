# Database Documentation

## Overview

Betty Organic App uses Supabase as its database solution, providing:
- PostgreSQL database
- Real-time subscriptions
- Row Level Security
- Authentication
- Storage

## Schema

### Users Table
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Profiles Table
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    role TEXT CHECK (role in ('admin', 'sales', 'customer')),
    status TEXT CHECK (status in ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Products Table
```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Orders Table
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    status TEXT CHECK (status in ('pending', 'processing', 'completed', 'cancelled')),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

### Users Policy
```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Admin full access
CREATE POLICY "Admin full access users" 
ON public.users FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### Products Policy
```sql
-- Anyone can view products
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT 
USING (true);

-- Only admin can modify products
CREATE POLICY "Admin can modify products" 
ON public.products FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### Orders Policy
```sql
-- Users can view own orders
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Sales and admin can view all orders
CREATE POLICY "Sales and admin can view all orders" 
ON public.orders FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'sales')
    )
);
```

## Migrations

Migrations are managed using Supabase migrations:

```bash
# Create a new migration
supabase migration new my_migration

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

## TypeScript Integration

### Types
```typescript
// types/database.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: 'admin' | 'sales' | 'customer';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
}
```

## Supabase Client

### Configuration
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Usage Examples
```typescript
// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Update product
const { data: product } = await supabase
  .from('products')
  .update({ stock: newStock })
  .eq('id', productId)
  .select()
  .single();

// Create order
const { data: order } = await supabase
  .from('orders')
  .insert({
    user_id: userId,
    status: 'pending',
    total: orderTotal
  })
  .select()
  .single();
```
