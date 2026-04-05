'use server'

import { createServiceClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addContract(companyId: string, formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const sc = createServiceClient()
  const { error } = await sc.from('company_contracts').insert({
    company_id: companyId,
    contract_name: formData.get('contract_name') as string,
    contract_type: (formData.get('contract_type') as string) || 'consulting',
    plan_id: (formData.get('plan_id') as string) || null,
    signed_date: (formData.get('signed_date') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    amount: formData.get('amount') ? Number(formData.get('amount')) : null,
    file_url: (formData.get('file_url') as string) || null,
    notes: (formData.get('notes') as string) || null,
    created_by: user?.id ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/contracts`)
}

export async function updateContract(contractId: string, companyId: string, formData: FormData) {
  const sc = createServiceClient()
  const { error } = await sc.from('company_contracts').update({
    contract_name: formData.get('contract_name') as string,
    contract_type: (formData.get('contract_type') as string) || 'consulting',
    plan_id: (formData.get('plan_id') as string) || null,
    signed_date: (formData.get('signed_date') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    amount: formData.get('amount') ? Number(formData.get('amount')) : null,
    file_url: (formData.get('file_url') as string) || null,
    status: (formData.get('status') as string) || undefined,
    notes: (formData.get('notes') as string) || null,
  }).eq('id', contractId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/contracts`)
}

export async function addTrainingPlan(name: string) {
  const sc = createServiceClient()
  const { data, error } = await sc.from('training_plans').insert({
    name,
  }).select('id, name').single()

  if (error) return { error: error.message }
  return { id: data.id, name: data.name }
}

export async function deleteContract(contractId: string, companyId: string) {
  const sc = createServiceClient()
  await sc.from('company_contracts').delete().eq('id', contractId)
  revalidatePath(`/companies/${companyId}/contracts`)
}

export async function addProposal(companyId: string, formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const sc = createServiceClient()
  const { error } = await sc.from('company_proposals').insert({
    company_id: companyId,
    year: Number(formData.get('year')),
    proposal_name: formData.get('proposal_name') as string,
    description: (formData.get('description') as string) || null,
    applied_amount: formData.get('applied_amount') ? Number(formData.get('applied_amount')) : null,
    approved_amount: formData.get('approved_amount') ? Number(formData.get('approved_amount')) : null,
    reimbursed_amount: formData.get('reimbursed_amount') ? Number(formData.get('reimbursed_amount')) : null,
    status: (formData.get('status') as string) || 'planning',
    notes: (formData.get('notes') as string) || null,
    created_by: user?.id ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/proposals`)
}
