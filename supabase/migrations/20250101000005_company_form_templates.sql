-- =============================================
-- 企業表單模板
-- 每家企業設定一次，課程建立時複製一份
-- =============================================

create table company_form_templates (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  pddro_phase pddro_phase not null,
  name        text not null,
  form_type   text not null check (form_type in ('online', 'upload', 'auto')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table course_forms
  add column template_id uuid references company_form_templates(id) on delete set null;

create trigger company_form_templates_updated_at
  before update on company_form_templates
  for each row execute function handle_updated_at();

alter table company_form_templates enable row level security;

create policy "consultant_all_templates" on company_form_templates
  for all using (is_consultant());

create policy "hr_select_templates" on company_form_templates
  for select using (company_id = get_my_company_id());

create index idx_cft_company_id on company_form_templates(company_id);
create index idx_cft_phase on company_form_templates(pddro_phase);
create index idx_course_forms_template_id on course_forms(template_id);
