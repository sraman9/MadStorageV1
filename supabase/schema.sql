-- MadStorage Supabase Schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

-- Storage requests (what students need)
create table if not exists storage_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  profile_image text,
  neighborhood text,
  items text,
  budget text,
  timeframe text,
  description text,
  created_at timestamptz default now()
);

-- Storage spaces (what hosts offer)
create table if not exists storage_spaces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  profile_image text,
  neighborhood text,
  space_image text,
  space_type text,
  items text,
  capacity text[],
  timeframe text,
  description text,
  price numeric,
  created_at timestamptz default now()
);

-- Ratings (1–5 stars on storage spaces)
create table if not exists ratings (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references storage_spaces(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  score smallint not null check (score >= 1 and score <= 5),
  comment text default '',
  created_at timestamptz default now(),
  unique(space_id, reviewer_id)  -- one rating per user per space
);

-- Row Level Security
alter table storage_requests enable row level security;
alter table storage_spaces enable row level security;
alter table ratings enable row level security;

-- Anyone can read
create policy "Public read requests" on storage_requests for select using (true);
create policy "Public read spaces" on storage_spaces for select using (true);

-- Authenticated users can insert their own
create policy "Auth insert requests" on storage_requests for insert with check (auth.uid() = user_id);
create policy "Auth insert spaces" on storage_spaces for insert with check (auth.uid() = user_id);

-- Users can update/delete their own
create policy "Auth update requests" on storage_requests for update using (auth.uid() = user_id);
create policy "Auth update spaces" on storage_spaces for update using (auth.uid() = user_id);
create policy "Auth delete requests" on storage_requests for delete using (auth.uid() = user_id);
create policy "Auth delete spaces" on storage_spaces for delete using (auth.uid() = user_id);

-- Ratings: anyone can read, auth users can insert/update their own
create policy "Public read ratings" on ratings for select using (true);
create policy "Auth insert ratings" on ratings for insert with check (auth.uid() = reviewer_id);
create policy "Auth update ratings" on ratings for update using (auth.uid() = reviewer_id);
create policy "Auth delete ratings" on ratings for delete using (auth.uid() = reviewer_id);
