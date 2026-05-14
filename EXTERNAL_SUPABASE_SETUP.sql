-- ============================================================
-- ElecTrack — External Supabase bootstrap
-- Project: zsbuqgdazgkdiskelsdl
-- Paste this entire file into:  Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1) Tables ---------------------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  client text default '',
  status text not null default 'กำลังทำ',
  income numeric not null default 0,
  dates text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  date date not null default current_date,
  category text not null default 'เดินสาย',
  detail text not null default '',
  qty numeric not null default 0,
  unit text not null default 'm',
  note text default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  date date not null default current_date,
  category text not null default 'อุปกรณ์ไฟฟ้า',
  name text default '',
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.work_presets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  detail text not null,
  unit text not null default 'm',
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category, detail, unit)
);

-- 2) RLS — public open (single-user app) ---------------------
alter table public.sites         enable row level security;
alter table public.work_logs     enable row level security;
alter table public.expenses      enable row level security;
alter table public.work_presets  enable row level security;

do $$ begin
  for t in select unnest(array['sites','work_logs','expenses','work_presets']) loop
    execute format('drop policy if exists "open all" on public.%I', t);
    execute format('create policy "open all" on public.%I for all using (true) with check (true)', t);
  end loop;
end $$;

-- 3) Realtime publication ------------------------------------
alter publication supabase_realtime add table public.sites;
alter publication supabase_realtime add table public.work_logs;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.work_presets;

-- 4) Storage bucket for work photos --------------------------
insert into storage.buckets (id, name, public)
values ('work-photos', 'work-photos', true)
on conflict (id) do nothing;

drop policy if exists "work-photos read"   on storage.objects;
drop policy if exists "work-photos write"  on storage.objects;
drop policy if exists "work-photos update" on storage.objects;
drop policy if exists "work-photos delete" on storage.objects;

create policy "work-photos read"   on storage.objects for select using (bucket_id = 'work-photos');
create policy "work-photos write"  on storage.objects for insert with check (bucket_id = 'work-photos');
create policy "work-photos update" on storage.objects for update using (bucket_id = 'work-photos');
create policy "work-photos delete" on storage.objects for delete using (bucket_id = 'work-photos');
