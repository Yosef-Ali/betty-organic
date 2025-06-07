-- Enable RLS
alter table profiles enable row level security;

-- Drop existing policies if they're causing recursion
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- Drop existing order policies
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;  
drop policy if exists "Users can update own orders" on orders;
drop policy if exists "Admin can view all orders" on orders;
drop policy if exists "Sales can view all orders" on orders;
drop policy if exists "Admin can modify all orders" on orders;
drop policy if exists "Sales can modify orders" on orders;

-- Create new policies with proper UUID casting
create policy "Users can view own profile"
on profiles for select
using (
  auth.uid()::text = id::text
);

create policy "Users can update own profile"
on profiles for update
using (
  auth.uid()::text = id::text
)
with check (
  auth.uid()::text = id::text
);

create policy "Users can insert own profile"
on profiles for insert
with check (
  auth.uid()::text = id::text
);

-- Enable RLS for orders table
alter table orders enable row level security;

-- Orders table policies with proper UUID casting and role-based access
create policy "Users can view own orders"
on orders for select
using (
  auth.uid()::text = customer_profile_id::text
);

create policy "Users can insert own orders"
on orders for insert
with check (
  auth.uid()::text = customer_profile_id::text
);

create policy "Users can update own orders"
on orders for update
using (
  auth.uid()::text = customer_profile_id::text
)
with check (
  auth.uid()::text = customer_profile_id::text
);

-- Admin users can view all orders
create policy "Admin can view all orders"
on orders for select
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Sales users can view all orders  
create policy "Sales can view all orders"
on orders for select
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'sales'
  )
);

-- Admin users can modify all orders
create policy "Admin can modify all orders"
on orders for update
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'admin'
  )
);

-- Sales users can modify orders
create policy "Sales can modify orders"
on orders for update
using (
  exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'sales'
  )
);
