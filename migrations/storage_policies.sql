-- Ensure storage schema exists
create schema if not exists storage;

-- Create about bucket with public access
insert into storage.buckets (id, name, public)
values ('about', 'about', true)
on conflict (id) do nothing;

-- Enable RLS with secure policies
alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;

-- Public read access for about content
create policy "Public About Read" on storage.objects
for select using (bucket_id = 'about');

create policy "Public Bucket Read" on storage.buckets
for select using (id = 'about');

-- Admin full access with JWT verification
create policy "Admin About Management" on storage.objects
for all using (
  bucket_id = 'about' and
  auth.role() = 'authenticated' and
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'app_metadata_role' = 'admin')
) with check (
  bucket_id = 'about' and
  auth.role() = 'authenticated' and
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'app_metadata_role' = 'admin')
);

-- Grant permissions
grant usage on schema storage to public;
grant select on storage.objects to public;
grant select on storage.buckets to public;
grant insert, update, delete on storage.objects to authenticated;
