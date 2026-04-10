-- 更新 handle_new_user trigger：
-- 1. on conflict 改用 upsert，確保透過邀請連結註冊時 company_id 會被寫入
-- 2. 同時設定 roles 陣列
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
SET search_path = public
as $$
declare
  _role user_role;
  _company_id uuid;
begin
  -- 安全地解析 role，無效值 fallback 為 employee
  begin
    _role := coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role,
      'employee'::user_role
    );
  exception when invalid_text_representation then
    _role := 'employee'::user_role;
  end;

  -- 安全地解析 company_id
  begin
    _company_id := (new.raw_user_meta_data ->> 'company_id')::uuid;
  exception when others then
    _company_id := null;
  end;

  insert into public.profiles (id, email, full_name, role, roles, company_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    _role,
    ARRAY[_role::text],
    _company_id
  )
  on conflict (id) do update set
    full_name  = coalesce(EXCLUDED.full_name, profiles.full_name),
    company_id = coalesce(EXCLUDED.company_id, profiles.company_id),
    roles      = case
                   when profiles.roles is null or array_length(profiles.roles, 1) is null
                   then ARRAY[EXCLUDED.role::text]
                   else profiles.roles
                 end,
    updated_at = now();

  return new;
end;
$$;
