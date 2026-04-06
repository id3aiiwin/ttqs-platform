'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** 單筆新增員工：建立 Supabase Auth 帳號 + profile */
export async function addEmployee(
  companyId: string,
  data: {
    email: string
    full_name: string
    role: string
    department_id: string | null
    job_title: string | null
    hire_date: string | null
    birthday: string | null
  }
) {
  const sc = createServiceClient()

  // 建立 auth 帳號
  const { data: authData, error: authError } = await sc.auth.admin.createUser({
    email: data.email,
    password: 'id3a',
    email_confirm: true,
  })

  let userId: string

  if (authError) {
    // 如果帳號已存在，嘗試用 email 找到 user
    if (authError.message?.includes('already') || authError.message?.includes('exists')) {
      const { data: { users } } = await sc.auth.admin.listUsers()
      const existing = users?.find(u => u.email === data.email)
      if (!existing) return { error: `帳號已存在但無法找到：${authError.message}` }
      userId = existing.id
    } else {
      return { error: `建立帳號失敗：${authError.message}` }
    }
  } else {
    userId = authData.user.id
  }

  // 建立或更新 profile
  const { error: profileError } = await sc.from('profiles').upsert({
    id: userId,
    email: data.email,
    full_name: data.full_name,
    role: data.role as 'hr' | 'manager' | 'employee',
    roles: [data.role],
    company_id: companyId,
    department_id: data.department_id || null,
    job_title: data.job_title || null,
    hire_date: data.hire_date || null,
    birthday: data.birthday || null,
  }, { onConflict: 'id' })

  if (profileError) return { error: `建立 profile 失敗：${profileError.message}` }

  revalidatePath(`/companies/${companyId}/employees`)
  revalidatePath(`/companies/${companyId}/organization`)
  return { ok: true }
}

/** 編輯員工資料 */
export async function updateEmployee(
  companyId: string,
  employeeId: string,
  data: {
    full_name: string
    role: string
    department_id: string | null
    job_title: string | null
    hire_date: string | null
    birthday: string | null
  }
) {
  const sc = createServiceClient()

  const { error } = await sc.from('profiles').update({
    full_name: data.full_name,
    role: data.role as 'hr' | 'manager' | 'employee',
    department_id: data.department_id || null,
    job_title: data.job_title || null,
    hire_date: data.hire_date || null,
    birthday: data.birthday || null,
  }).eq('id', employeeId)

  if (error) return { error: error.message }

  revalidatePath(`/companies/${companyId}/employees`)
  revalidatePath(`/companies/${companyId}/organization`)
  return { ok: true }
}

/** 刪除員工（移除 profile + auth 帳號） */
export async function deleteEmployee(companyId: string, employeeId: string) {
  const sc = createServiceClient()

  // 先刪 profile
  const { error: profileError } = await sc.from('profiles').delete().eq('id', employeeId)
  if (profileError) return { error: profileError.message }

  // 刪 auth 帳號
  const { error: authError } = await sc.auth.admin.deleteUser(employeeId)
  if (authError) return { error: `Profile 已刪除但 Auth 帳號刪除失敗：${authError.message}` }

  revalidatePath(`/companies/${companyId}/employees`)
  revalidatePath(`/companies/${companyId}/organization`)
  return { ok: true }
}
