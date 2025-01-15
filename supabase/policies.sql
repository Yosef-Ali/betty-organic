-- Enable RLS
alter table profiles enable row level security;

-- Drop existing policies if they're causing recursion
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

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

-- Orders table policies with proper UUID casting
create policy "Users can view own orders"
on orders for select
using (
  auth.uid()::text = customer_id::text
);

create policy "Users can insert own orders"
on orders for insert
with check (
  auth.uid()::text = customer_id::text
);

create policy "Users can update own orders"
on orders for update
using (
  auth.uid()::text = customer_id::text
)
with check (
  auth.uid()::text = customer_id::text
);
