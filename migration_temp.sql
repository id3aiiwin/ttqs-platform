-- =============================================
-- 四階文件管理四個資料表（之前漏建）
-- =============================================

create table if not exists document_templates (
  id                    uuid primary key default uuid_generate_v4(),
  title                 text not null,
  tier                  integer not null check (tier between 1 and 4),
  linked_to_course_form boolean not null default false,
  pddro_phase           pddro_phase,
  auto_generated_from   text check (auto_generated_from in ('JD', 'course_form')),
  ttqs_indicator        text,
  description           text,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger document_templates_updated_at
  before update on document_templates for each row execute function handle_updated_at();
alter table document_templates enable row level security;
create policy "consultant_all_document_templates" on document_templates for all using (is_consultant());
create policy "authenticated_select_document_templates" on document_templates for select using (auth.uid() is not null);

create table if not exists company_documents (
  id                    uuid primary key default uuid_generate_v4(),
  company_id            uuid not null references companies(id) on delete cascade,
  template_id           uuid,
  doc_number            text,
  title                 text not null,
  tier                  integer not null check (tier between 1 and 4),
  version               text,
  source                text not null default 'template' check (source in ('template', 'upload', 'auto_generated')),
  file_url              text,
  linked_to_course_form boolean not null default false,
  pddro_phase           pddro_phase,
  auto_generated_from   text check (auto_generated_from in ('JD', 'course_form')),
  status                text not null default 'draft' check (status in ('draft', 'pending_review', 'approved')),
  ttqs_indicator        text,
  notes                 text,
  created_by            uuid references profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger company_documents_updated_at
  before update on company_documents for each row execute function handle_updated_at();
alter table company_documents enable row level security;
create policy "consultant_all_company_documents" on company_documents for all using (is_consultant());
create policy "hr_select_company_documents" on company_documents for select using (
  get_my_role() in ('hr', 'manager') and company_id = get_my_company_id()
);
create policy "hr_insert_company_documents" on company_documents for insert with check (
  get_my_role() = 'hr' and company_id = get_my_company_id()
);
create policy "hr_update_company_documents" on company_documents for update using (
  get_my_role() = 'hr' and company_id = get_my_company_id()
);

create table if not exists company_document_versions (
  id            uuid primary key default uuid_generate_v4(),
  document_id   uuid not null references company_documents(id) on delete cascade,
  version       text not null,
  file_url      text,
  change_note   text,
  changed_by    uuid references profiles(id) on delete set null,
  changed_at    timestamptz not null default now()
);
alter table company_document_versions enable row level security;
create policy "consultant_all_doc_versions" on company_document_versions for all using (is_consultant());
create policy "company_select_doc_versions" on company_document_versions for select using (
  exists (select 1 from company_documents d where d.id = company_document_versions.document_id and d.company_id = get_my_company_id())
);

create table if not exists company_document_reviews (
  id            uuid primary key default uuid_generate_v4(),
  document_id   uuid not null references company_documents(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  status        text not null check (status in ('needs_revision', 'approved')),
  comment       text,
  reviewed_at   timestamptz not null default now()
);
alter table company_document_reviews enable row level security;
create policy "consultant_all_doc_reviews" on company_document_reviews for all using (is_consultant());
create policy "company_select_doc_reviews" on company_document_reviews for select using (
  exists (select 1 from company_documents d where d.id = company_document_reviews.document_id and d.company_id = get_my_company_id())
);

create index if not exists idx_document_templates_tier on document_templates(tier);
create index if not exists idx_company_documents_company_id on company_documents(company_id);
create index if not exists idx_company_documents_tier on company_documents(tier);
create index if not exists idx_company_documents_status on company_documents(status);
create index if not exists idx_doc_versions_document_id on company_document_versions(document_id);
create index if not exists idx_doc_reviews_document_id on company_document_reviews(document_id);
