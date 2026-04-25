'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateCompany(companyId: string) {
  revalidatePath(`/companies/${companyId}/settings`)
  revalidatePath(`/companies/${companyId}/organization`)
}

export async function addDepartment(companyId: string, name: string, managerId?: string) {
  const sc = createServiceClient()

  const { data: existing } = await sc.from('departments')
    .select('sort_order').eq('company_id', companyId)
    .order('sort_order', { ascending: false }).limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await sc.from('departments').insert({
    company_id: companyId,
    name,
    manager_id: managerId || null,
    sort_order: nextOrder,
  })
  if (error) return { error: error.message }
  revalidateCompany(companyId)
}

export async function updateDepartment(
  deptId: string, companyId: string,
  data: { name?: string; managerId?: string | null; isActive?: boolean }
) {
  const sc = createServiceClient()
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.managerId !== undefined) updates.manager_id = data.managerId || null
  if (data.isActive !== undefined) updates.is_active = data.isActive

  const { error } = await sc.from('departments').update(updates).eq('id', deptId)
  if (error) return { error: error.message }
  revalidateCompany(companyId)
}

export async function deleteDepartment(deptId: string, companyId: string) {
  const sc = createServiceClient()

  const { data: employees } = await sc.from('profiles')
    .select('id').eq('department_id', deptId).limit(1)

  if (employees && employees.length > 0) {
    return { error: '此部門仍有員工帳號，無法刪除。請先將員工移至其他部門。' }
  }

  const { error } = await sc.from('departments').delete().eq('id', deptId)
  if (error) return { error: error.message }
  revalidateCompany(companyId)
}
