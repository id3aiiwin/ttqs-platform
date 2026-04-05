create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  user_name text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb default '{}',
  ip_address text,
  created_at timestamptz default now()
);

create index idx_audit_logs_user on audit_logs(user_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index idx_audit_logs_created on audit_logs(created_at desc);

-- RLS
alter table audit_logs enable row level security;
create policy "Consultants can read audit logs" on audit_logs for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('consultant', 'admin'))
);
