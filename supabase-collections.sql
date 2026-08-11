-- Run this in Supabase SQL Editor to create collections for all admin sidebar pages.
-- Covers: Team, Manage Contact, and optional site settings.

-- team_members: powers Admin → Team and public /team page
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  email text,
  phone text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.team_members enable row level security;

-- Allow public read for team page; insert/update/delete via service role (admin APIs)
create policy "team_members public read" on public.team_members for select using (true);

create index if not exists idx_team_members_sort on public.team_members(sort_order asc);

-- contact_submissions: contact form entries; Admin → Manage Contact
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.contact_submissions enable row level security;

-- Only service role can read/update; insert via API (service role). No anon policies.

create index if not exists idx_contact_submissions_created_at on public.contact_submissions(created_at desc);

-- site_settings: key-value for contact email, phone, etc. (optional)
create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

create policy "site_settings public read" on public.site_settings for select using (true);

-- Seed default team members only if table is empty (run script once)
insert into public.team_members (name, role, sort_order)
select * from (values
  ('Sourabh Sarkar', 'Finance and Social Media', 1),
  ('Akash', 'Finance', 2),
  ('Monu Kumar', 'POC & Outreaches', 3),
  ('Manish Kumar', 'POC & Outreaches', 4),
  ('Shreya Narayani', 'Outreaches and Social Media', 5),
  ('Kartik Reddy', 'Event & Resource Management', 6),
  ('Murli', 'Media Management', 7)
) as v(name, role, sort_order)
where not exists (select 1 from public.team_members limit 1);

-- Seed default site contact info (optional)
insert into public.site_settings (key, value) values
  ('contact_email', 'morethanme@rishihood.edu.in'),
  ('contact_phone', '+91 7541062514')
on conflict (key) do update set value = excluded.value, updated_at = now();
