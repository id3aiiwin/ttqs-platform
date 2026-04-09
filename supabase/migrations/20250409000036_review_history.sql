-- 審閱歷史紀錄表
create table if not exists competency_form_reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references competency_form_entries(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  comment text not null default '',
  action text not null check (action in ('approved', 'needs_revision')),
  created_at timestamptz not null default now()
);

-- 索引：按 entry 查詢審閱紀錄
create index idx_form_reviews_entry on competency_form_reviews(entry_id, created_at desc);

-- RLS
alter table competency_form_reviews enable row level security;

-- 所有登入用戶都能讀取
create policy "Authenticated users can read reviews"
  on competency_form_reviews for select
  to authenticated
  using (true);

-- 只有 consultant/admin 能新增
create policy "Consultants can insert reviews"
  on competency_form_reviews for insert
  to authenticated
  with check (true);
