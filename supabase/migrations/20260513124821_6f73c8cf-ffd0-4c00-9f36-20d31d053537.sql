
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  client text default '',
  status text not null default 'กำลังทำ',
  income numeric not null default 0,
  dates text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.work_logs (
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

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade,
  date date not null default current_date,
  category text not null default 'อุปกรณ์ไฟฟ้า',
  name text default '',
  amount numeric not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;
alter table public.work_logs enable row level security;
alter table public.expenses enable row level security;

create policy "public read sites" on public.sites for select using (true);
create policy "public write sites" on public.sites for insert with check (true);
create policy "public update sites" on public.sites for update using (true);
create policy "public delete sites" on public.sites for delete using (true);

create policy "public read logs" on public.work_logs for select using (true);
create policy "public write logs" on public.work_logs for insert with check (true);
create policy "public update logs" on public.work_logs for update using (true);
create policy "public delete logs" on public.work_logs for delete using (true);

create policy "public read exp" on public.expenses for select using (true);
create policy "public write exp" on public.expenses for insert with check (true);
create policy "public update exp" on public.expenses for update using (true);
create policy "public delete exp" on public.expenses for delete using (true);

insert into storage.buckets (id, name, public) values ('work-photos', 'work-photos', true)
on conflict (id) do nothing;

create policy "public read work-photos" on storage.objects for select using (bucket_id = 'work-photos');
create policy "public upload work-photos" on storage.objects for insert with check (bucket_id = 'work-photos');
create policy "public delete work-photos" on storage.objects for delete using (bucket_id = 'work-photos');
