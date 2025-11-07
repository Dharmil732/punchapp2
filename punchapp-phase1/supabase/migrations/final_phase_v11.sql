
-- Final v11 schema (essentials)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

do $$ begin create type role_type as enum ('view','employee','supervisor','manager','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type punch_kind as enum ('in','out','break_in','break_out'); exception when duplicate_object then null; end $$;
do $$ begin create type request_type as enum ('unscheduled_justification','drop','pickup','swap','extension'); exception when duplicate_object then null; end $$;
do $$ begin create type request_status as enum ('pending','approved','declined','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type task_status as enum ('open','done'); exception when duplicate_object then null; end $$;
do $$ begin create type priority_level as enum ('low','normal','high'); exception when duplicate_object then null; end $$;
do $$ begin create type recurrence_kind as enum ('none','daily','weekly','monthly'); exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique, name text, role role_type not null default 'employee',
  employee_code text, created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique, address text, lat double precision, lng double precision, radius_m integer default 150,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  start_at timestamptz not null, end_at timestamptz not null,
  approved_by uuid references profiles(id), notes text, created_at timestamptz not null default now()
);

create table if not exists punches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null,
  kind punch_kind not null, at timestamptz not null,
  reason text, client_meta jsonb, admin_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
insert into settings(key,value) values
  ('overtime', jsonb_build_object('multiplier', 1.5, 'weekly_cap_hours', 40)),
  ('paid_scheduled_hours_only', jsonb_build_object('enabled', true)),
  ('break_rules', jsonb_build_object('rule_8h', jsonb_build_object('paid_min',30,'unpaid_min',30),'rule_5_5h', jsonb_build_object('paid_min',0,'unpaid_min',30))),
  ('geo_policy', jsonb_build_object('radius_m',150,'grace_min',5))
on conflict (key) do nothing;

create table if not exists payroll_rates ( user_id uuid primary key references profiles(id) on delete cascade, currency text not null default 'USD', rate_per_hour numeric(12,2) not null default 0 );
create table if not exists shift_requests (
  id uuid primary key default uuid_generate_v4(), type request_type not null, requester_id uuid not null references profiles(id) on delete cascade,
  shift_id uuid references shifts(id) on delete set null, requested_end_at timestamptz, partner_user_id uuid references profiles(id),
  status request_status not null default 'pending', reason text, decided_by uuid references profiles(id), decided_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists tasks (
  id bigserial primary key, title text not null, assignee_id uuid references profiles(id) on delete set null,
  creator_id uuid references profiles(id) on delete set null, status task_status not null default 'open', priority priority_level not null default 'normal',
  due_at timestamptz, recurrence recurrence_kind not null default 'none', notes text, created_at timestamptz not null default now(), done_at timestamptz
);
create table if not exists task_comments ( id bigserial primary key, task_id bigint not null references tasks(id) on delete cascade, author_id uuid references profiles(id) on delete set null, body text not null, created_at timestamptz not null default now() );
create table if not exists exports_log ( id bigserial primary key, kind text not null, start_date date, end_date date, location text, created_at timestamptz not null default now() );
create table if not exists audit_log ( id bigserial primary key, actor_id uuid references profiles(id), actor_email text, action text not null, entity text not null, entity_id text, details jsonb, created_at timestamptz not null default now() );

-- Payroll computation RPCs (short version)
create or replace function compute_paid_minutes_for_window(p_user uuid, p_start timestamptz, p_end timestamptz)
returns int language plpgsql as $$
declare paid_only boolean := coalesce( (select (value->>'enabled')::boolean from settings where key='paid_scheduled_hours_only'), true );
  v_in timestamptz; v_out timestamptz; total_min int := 0; rec record; shift_minutes int := greatest(0, extract(epoch from (p_end - p_start))/60)::int;
  unpaid_break_min int := 0; br8 jsonb := (select value->'rule_8h' from settings where key='break_rules'); br55 jsonb := (select value->'rule_5_5h' from settings where key='break_rules');
begin
  for rec in select kind, at from punches where user_id=p_user and at >= p_start - interval '1 day' and at <= p_end + interval '1 day' order by at loop
    if rec.kind='in' then v_in := greatest(rec.at, p_start);
    elsif rec.kind='out' and v_in is not null then v_out := least(rec.at, p_end); if v_out > v_in then total_min := total_min + greatest(0, extract(epoch from (v_out - v_in))/60)::int; end if; v_in := null; v_out := null; end if;
  end loop;
  if paid_only and total_min = 0 then return 0; end if;
  if shift_minutes >= 480 then unpaid_break_min := greatest(unpaid_break_min, coalesce((br8->>'unpaid_min')::int,30));
  elsif shift_minutes >= 330 then unpaid_break_min := greatest(unpaid_break_min, coalesce((br55->>'unpaid_min')::int,30)); end if;
  total_min := greatest(0, total_min - unpaid_break_min); return total_min;
end $$;

create or replace function payroll_with_rates_and_ot(p_start date, p_end date)
returns table(user_id uuid, email text, name text, employee_code text, minutes_paid int, base_hours numeric, ot_hours numeric, currency text, rate_per_hour numeric, amount_base numeric, amount_ot numeric, amount_total numeric)
language plpgsql as $$
declare ot_multiplier numeric := coalesce( (select (value->>'multiplier')::numeric from settings where key='overtime'), 1.5 );
  weekly_cap_hours numeric := coalesce( (select (value->>'weekly_cap_hours')::numeric from settings where key='overtime'), 40 );
  r record; week_start date; week_end date; mins int; cap int := (weekly_cap_hours*60)::int; paid_week int; base_min int; ot_min int;
begin
  for r in select pr.id user_id, pr.email, pr.name, pr.employee_code, rr.currency, rr.rate_per_hour from profiles pr left join payroll_rates rr on rr.user_id=pr.id loop
    minutes_paid := 0; base_hours := 0; ot_hours := 0;
    for week_start in select generate_series(p_start, p_end, interval '7 days')::date loop
      week_end := least(week_start + 6, p_end); paid_week := 0;
      for mins in select compute_paid_minutes_for_window(r.user_id, s.start_at, s.end_at) from shifts s where s.user_id=r.user_id and s.start_at::date <= week_end and s.end_at::date >= week_start loop
        paid_week := paid_week + mins;
      end loop;
      if paid_week > 0 then base_min := least(paid_week, cap); ot_min := greatest(0, paid_week - cap);
        minutes_paid := minutes_paid + paid_week; base_hours := base_hours + base_min/60.0; ot_hours := ot_hours + ot_min/60.0; end if;
    end loop;
    amount_base := round(base_hours * coalesce(r.rate_per_hour,0), 2);
    amount_ot   := round(ot_hours * coalesce(r.rate_per_hour,0) * ot_multiplier, 2);
    amount_total:= amount_base + amount_ot;
    return next;
  end loop;
end $$;

-- Auto-out at midnight, using scheduled end when available
create or replace function auto_punch_out_midnight() returns void language plpgsql as $$
declare u record; open_in timestamptz; scheduled_end timestamptz; out_at timestamptz;
begin
  for u in with last_ev as (select user_id, max(at) as last_at, (array_agg(kind order by at desc))[1] as last_kind from punches where at >= now()::date - interval '1 day' group by user_id)
    select l.user_id from last_ev l where l.last_kind='in'
  loop
    select at into open_in from punches where user_id=u.user_id and kind='in' order by at desc limit 1;
    select s.end_at into scheduled_end from shifts s where s.user_id=u.user_id and open_in between s.start_at - interval '12 hour' and s.end_at + interval '12 hour' order by abs(extract(epoch from (open_in - s.start_at))) asc limit 1;
    if scheduled_end is not null then out_at := scheduled_end; else out_at := date_trunc('day', open_in) + interval '23 hours 59 minutes'; end if;
    perform 1 from punches where user_id=u.user_id and kind='out' and at>open_in;
    if not found then insert into punches(user_id, kind, at, reason, client_meta) values (u.user_id, 'out', out_at, 'auto-out-midnight', jsonb_build_object('system',true)); end if;
  end loop;
end $$;
select cron.schedule('auto_punch_out_midnight_job', '5 0 * * *', $$select auto_punch_out_midnight();$$) on conflict do nothing;

-- RLS (essentials)
alter table profiles enable row level security;
alter table shifts enable row level security;
alter table punches enable row level security;
alter table payroll_rates enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table shift_requests enable row level security;
alter table settings enable row level security;
alter table exports_log enable row level security;
alter table audit_log enable row level security;
alter table stores enable row level security;

create or replace function uid() returns uuid language sql stable as $$ select auth.uid() $$;

drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles for select using (id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
create policy "profiles_admin_write" on profiles for all using (exists (select 1 from profiles p where p.id=uid() and p.role in ('manager','admin'))) with check (exists (select 1 from profiles p where p.id=uid() and p.role in ('manager','admin')));

drop policy if exists "shifts_view" on shifts;
create policy "shifts_view" on shifts for select using (user_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
create policy "shifts_admin_write" on shifts for all using (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin'))) with check (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));

drop policy if exists "punches_view" on punches;
create policy "punches_view" on punches for select using (user_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
create policy "punches_insert_self" on punches for insert with check (user_id = uid());
create policy "punches_admin_write" on punches for all using (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin'))) with check (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));

drop policy if exists "tasks_read" on tasks;
create policy "tasks_read" on tasks for select using (assignee_id = uid() or creator_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
create policy "tasks_write_creator_or_admin" on tasks for all using (creator_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin'))) with check (creator_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));

drop policy if exists "task_comments_read" on task_comments;
create policy "task_comments_read" on task_comments for select using (exists (select 1 from tasks t where t.id=task_comments.task_id and (t.assignee_id=uid() or t.creator_id=uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')))));
create policy "task_comments_write" on task_comments for insert with check (author_id = uid());

drop policy if exists "requests_view" on shift_requests;
create policy "requests_view" on shift_requests for select using (requester_id = uid() or exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
create policy "requests_insert_self" on shift_requests for insert with check (requester_id = uid());
create policy "requests_admin_write" on shift_requests for all using (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin'))) with check (exists (select 1 from profiles p where p.id=uid() and p.role in ('supervisor','manager','admin')));
