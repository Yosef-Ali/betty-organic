-- Enable RLS
alter table profiles enable row level security;

-- Drop existing policies if they're causing recursion
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- Create new policies
create policy "Users can view own profile"
on profiles for select
using (
  auth.uid() = id
);

create policy "Users can update own profile"
on profiles for update
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);

-- Enable inserts with a separate policy if needed
create policy "Users can insert own profile"
on profiles for insert
with check (
  auth.uid() = id
);
