-- =============================================
-- TTQS Platform - Initial Schema
-- =============================================

-- 啟用必要的 extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

create type user_role as enum ('consultant', 'hr', 'manager', 'employee');
create type company_status as enum ('active', 'inactive', 'pending');
create type ttqs_level as enum ('bronze', 'silver', 'gold');
create type course_status as enum ('draft', 'planned', 'in_progress', 'completed', 'cancelled');
create type pddro_phase as enum ('P', 'D1', 'D2', 'D3', 'R', 'O');

-- =============================================
-- TABLES
-- =============================================

-- 企業表
create table companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  industry    text,
  contact_person text,
  contact_email  text,
  contact_phone  text,
  ttqs_level     ttqs_level,
  ttqs_expiry_date date,
  status      company_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 用戶檔案（對應 auth.users）
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        user_role not null default 'employee',
  company_id  uuid references companies(id) on delete set null,
  department_id uuid, -- 稍後加 FK
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 部門表
create table departments (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  manager_id  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 加回 department FK
alter table profiles
  add constraint profiles_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

-- 課程表
create table courses (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  title       text not null,
  description text,
  pddro_phase pddro_phase not null,
  status      course_status not null default 'draft',
  start_date  date,
  end_date    date,
  hours       numeric(6,1),
  trainer     text,
  budget      numeric(12,2),
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 會議記錄表
create table meetings (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  meeting_date timestamptz not null,
  attendees    text[] not null default '{}',
  agenda       text,
  notes        text,
  action_items jsonb not null default '[]',
  company_id   uuid references companies(id) on delete set null,
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at
  before update on companies
  for each row execute function handle_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();

create trigger courses_updated_at
  before update on courses
  for each row execute function handle_updated_at();

create trigger meetings_updated_at
  before update on meetings
  for each row execute function handle_updated_at();

-- =============================================
-- AUTO CREATE PROFILE ON SIGNUP
-- =============================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'employee')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table companies   enable row level security;
alter table profiles    enable row level security;
alter table departments enable row level security;
alter table courses     enable row level security;
alter table meetings    enable row level security;

-- Helper function: 取得目前用戶角色
create or replace function get_my_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper function: 取得目前用戶所屬企業
create or replace function get_my_company_id()
returns uuid language sql security definer stable as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Helper function: 是否為顧問
create or replace function is_consultant()
returns boolean language sql security definer stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'consultant')
$$;

-- =============================================
-- RLS POLICIES - companies
-- =============================================

-- 顧問：看所有
create policy "consultant_select_companies" on companies
  for select using (is_consultant());

-- 非顧問：只看自己的企業
create policy "company_user_select_companies" on companies
  for select using (id = get_my_company_id());

-- 顧問：可以新增/修改企業
create policy "consultant_insert_companies" on companies
  for insert with check (is_consultant());

create policy "consultant_update_companies" on companies
  for update using (is_consultant());

-- =============================================
-- RLS POLICIES - profiles
-- =============================================

-- 顧問：看所有 profiles
create policy "consultant_select_profiles" on profiles
  for select using (is_consultant());

-- 自己看自己
create policy "self_select_profile" on profiles
  for select using (id = auth.uid());

-- 同公司 HR 看同公司員工
create policy "hr_select_company_profiles" on profiles
  for select using (
    get_my_role() = 'hr' and
    company_id = get_my_company_id()
  );

-- 主管看同部門
create policy "manager_select_department_profiles" on profiles
  for select using (
    get_my_role() = 'manager' and
    department_id = (select department_id from profiles where id = auth.uid())
  );

-- 自己更新自己
create policy "self_update_profile" on profiles
  for update using (id = auth.uid());

-- =============================================
-- RLS POLICIES - departments
-- =============================================

create policy "consultant_all_departments" on departments
  for all using (is_consultant());

create policy "company_select_departments" on departments
  for select using (company_id = get_my_company_id());

-- =============================================
-- RLS POLICIES - courses
-- =============================================

create policy "consultant_all_courses" on courses
  for all using (is_consultant());

create policy "hr_company_courses" on courses
  for select using (
    get_my_role() = 'hr' and
    company_id = get_my_company_id()
  );

create policy "hr_insert_courses" on courses
  for insert with check (
    get_my_role() = 'hr' and
    company_id = get_my_company_id()
  );

create policy "manager_department_courses" on courses
  for select using (
    get_my_role() = 'manager' and
    company_id = get_my_company_id()
  );

-- =============================================
-- RLS POLICIES - meetings
-- =============================================

-- 會議記錄只有顧問能操作（內部使用）
create policy "consultant_all_meetings" on meetings
  for all using (is_consultant());

-- 企業 HR 可以查看與自己企業相關的會議
create policy "hr_view_company_meetings" on meetings
  for select using (
    get_my_role() = 'hr' and
    company_id = get_my_company_id()
  );

-- =============================================
-- INDEXES
-- =============================================

create index idx_profiles_company_id on profiles(company_id);
create index idx_profiles_role on profiles(role);
create index idx_courses_company_id on courses(company_id);
create index idx_courses_pddro_phase on courses(pddro_phase);
create index idx_courses_status on courses(status);
create index idx_meetings_company_id on meetings(company_id);
create index idx_meetings_meeting_date on meetings(meeting_date);
create index idx_departments_company_id on departments(company_id);
