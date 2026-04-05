-- =============================================
-- 修復 handle_new_user trigger
-- 問題：search_path 未設定導致 user_role 型別找不到
-- =============================================

-- 先刪除舊 trigger 與 function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 重建 function，加上 SET search_path = public
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
SET search_path = public
as $$
declare
  _role user_role;
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

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    _role
  )
  on conflict (id) do nothing;  -- 避免重複 insert 時炸掉

  return new;
end;
$$;

-- 重建 trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 確認設定正確
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
