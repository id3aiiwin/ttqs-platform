'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function orgPath(companyId: string) { return `/companies/${companyId}/organization` }

export async function updateEmployeeRole(profileId: string, role: string, companyId: string) {
  const sc = createServiceClient()
  await sc.from('profiles').update({ role: role as 'hr' | 'manager' | 'employee' }).eq('id', profileId)
  revalidatePath(orgPath(companyId))
}

export async function updateEmployeeDepartment(profileId: string, departmentId: string | null, companyId: string) {
  const sc = createServiceClient()
  await sc.from('profiles').update({ department_id: departmentId }).eq('id', profileId)
  revalidatePath(orgPath(companyId))
}
