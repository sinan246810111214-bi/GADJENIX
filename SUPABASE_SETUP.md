# Supabase Setup for Gadgenix

To get the Admin Dashboard working, you need to set up your Supabase project with the following table and storage bucket.

## 1. Database Table: `products`

Run this SQL in your Supabase SQL Editor:

```sql
-- Create products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  category text not null,
  original_price numeric not null,
  sale_price numeric not null,
  features text,
  image_url text,
  vendor text default 'Gadgenix Official'
);

-- Set up Row Level Security (RLS)
alter table public.products enable row level security;

-- Allow public read access
create policy "Allow public read access"
  on public.products for select
  using (true);

-- Allow authenticated admin access (insert, update, delete)
-- Note: In a production app, you should check for an 'admin' role or specific UID.
create policy "Allow authenticated admin access"
  on public.products for all
  to authenticated
  using (true)
  with check (true);
```

## 2. Storage Bucket: `gadgenix-assets`

1. Go to **Storage** in your Supabase Dashboard.
2. Create a new bucket named `gadgenix-assets`.
3. Set the bucket to **Public** (so image URLs are accessible).
4. Add a policy to allow **Authenticated** users to upload files to the `product-images/` folder.

## 3. Environment Variables

Add these to your AI Studio Secrets (Settings > Secrets):

- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for server-side operations if needed)
