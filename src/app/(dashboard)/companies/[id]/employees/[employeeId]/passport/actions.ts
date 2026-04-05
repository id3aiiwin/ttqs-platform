'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function passportPath(companyId: string, employeeId: string) {
  return `/companies/${companyId}/employees/${employeeId}/passport`
}

// === 證照 ===

export async function addCertificate(
  companyId: string,
  employeeId: string,
  data: { name: string; issuer?: string; issued_date?: string; expiry_date?: string }
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('employee_certificates').insert({
    employee_id: employeeId,
    company_id: companyId,
    name: data.name,
    issuer: data.issuer || null,
    issued_date: data.issued_date || null,
    expiry_date: data.expiry_date || null,
  })
  if (error) return { error: error.message }
  revalidatePath(passportPath(companyId, employeeId))
}

export async function deleteCertificate(certId: string, companyId: string, employeeId: string) {
  const supabase = createServiceClient()
  await supabase.from('employee_certificates').delete().eq('id', certId)
  revalidatePath(passportPath(companyId, employeeId))
}

// === IDP ===

export async function addIdp(
  companyId: string,
  employeeId: string,
  data: {
    competency_name: string
    current_level: number
    target_level: number
    target_date?: string
    consultant_notes?: string
  }
) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const supabase = createServiceClient()
  const { error } = await supabase.from('employee_idp').insert({
    employee_id: employeeId,
    company_id: companyId,
    created_by: user?.id ?? null,
    competency_name: data.competency_name,
    current_level: data.current_level,
    target_level: data.target_level,
    target_date: data.target_date || null,
    consultant_notes: data.consultant_notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(passportPath(companyId, employeeId))
}

export async function updateIdpStatus(idpId: string, status: string, companyId: string, employeeId: string) {
  const supabase = createServiceClient()
  await supabase.from('employee_idp').update({
    status: status as 'in_progress' | 'completed' | 'paused',
  }).eq('id', idpId)
  revalidatePath(passportPath(companyId, employeeId))
}

export async function deleteIdp(idpId: string, companyId: string, employeeId: string) {
  const supabase = createServiceClient()
  await supabase.from('employee_idp').delete().eq('id', idpId)
  revalidatePath(passportPath(companyId, employeeId))
}

// === 職能分數 ===

export async function upsertCompetencyScore(
  companyId: string,
  employeeId: string,
  competencyName: string,
  score: number
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('core_competency_scores').upsert(
    {
      employee_id: employeeId,
      company_id: companyId,
      competency_name: competencyName,
      score,
    },
    { onConflict: 'employee_id,competency_name' }
  )
  if (error) return { error: error.message }
  revalidatePath(passportPath(companyId, employeeId))
}
