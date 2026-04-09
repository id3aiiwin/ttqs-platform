-- 更新 handle_new_user trigger：支援從 metadata 帶入 company_id
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

  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    _role,
    _company_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
