-- Create About table
create table if not exists public.about (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    content text not null,
    images jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security
alter table public.about enable row level security;

-- Allow public read access
create policy "Allow public read access on about"
    on public.about
    for select
    to public
    using (true);

-- Allow admin write access
create policy "Allow admin write access on about"
    on public.about
    for all
    to authenticated
    using (auth.jwt() ->> 'role' = 'admin')
    with check (auth.jwt() ->> 'role' = 'admin');

-- Function to automatically update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Trigger to call the function before update
create trigger update_about_updated_at
    before update on public.about
    for each row
    execute function update_updated_at_column();
