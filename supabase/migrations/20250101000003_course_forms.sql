-- =============================================
-- 課程表單（PDDRO 五構面文件管理）
-- =============================================

create table course_forms (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  pddro_phase pddro_phase not null,
  name        text not null,
  form_type   text not null check (form_type in ('online', 'upload', 'auto')),
  sort_order  integer not null default 0,
  status      text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  file_url    text,
  form_data   jsonb,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger
create trigger course_forms_updated_at
  before update on course_forms
  for each row execute function handle_updated_at();

-- RLS
alter table course_forms enable row level security;

create policy "consultant_all_course_forms" on course_forms
  for all using (is_consultant());

create policy "hr_select_course_forms" on course_forms
  for select using (
    exists (
      select 1 from courses c
      where c.id = course_forms.course_id
        and c.company_id = get_my_company_id()
    )
  );

-- Indexes
create index idx_course_forms_course_id on course_forms(course_id);
create index idx_course_forms_phase on course_forms(pddro_phase);
