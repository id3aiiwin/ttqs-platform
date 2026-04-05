'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(1, '企業名稱為必填'),
  industry: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email('請輸入有效的電子郵件').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  ttqs_level: z.enum(['bronze', 'silver', 'gold']).optional().or(z.literal('')),
  ttqs_expiry_date: z.string().optional(),
})

type FormState = { error?: string; fieldErrors?: Record<string, string> } | null

export async function createCompany(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()

  const raw = {
    name: formData.get('name'),
    industry: formData.get('industry') || undefined,
    contact_person: formData.get('contact_person') || undefined,
    contact_email: formData.get('contact_email') || undefined,
    contact_phone: formData.get('contact_phone') || undefined,
    status: formData.get('status') || 'pending',
    ttqs_level: formData.get('ttqs_level') || undefined,
    ttqs_expiry_date: formData.get('ttqs_expiry_date') || undefined,
  }

  const result = companySchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach((e) => {
      if (e.path[0]) fieldErrors[e.path[0] as string] = e.message
    })
    return { fieldErrors }
  }

  const data = result.data
  const { error } = await supabase.from('companies').insert({
    name: data.name,
    industry: data.industry || null,
    contact_person: data.contact_person || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    status: data.status,
    ttqs_level: (data.ttqs_level || null) as 'bronze' | 'silver' | 'gold' | null,
    ttqs_expiry_date: data.ttqs_expiry_date || null,
  })

  if (error) return { error: error.message }

  redirect('/companies')
}

export async function updateCompany(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()

  const raw = {
    name: formData.get('name'),
    industry: formData.get('industry') || undefined,
    contact_person: formData.get('contact_person') || undefined,
    contact_email: formData.get('contact_email') || undefined,
    contact_phone: formData.get('contact_phone') || undefined,
    status: formData.get('status') || 'pending',
    ttqs_level: formData.get('ttqs_level') || undefined,
    ttqs_expiry_date: formData.get('ttqs_expiry_date') || undefined,
  }

  const result = companySchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach((e) => {
      if (e.path[0]) fieldErrors[e.path[0] as string] = e.message
    })
    return { fieldErrors }
  }

  const data = result.data
  const { error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      industry: data.industry || null,
      contact_person: data.contact_person || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      status: data.status,
      ttqs_level: (data.ttqs_level || null) as 'bronze' | 'silver' | 'gold' | null,
      ttqs_expiry_date: data.ttqs_expiry_date || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  redirect(`/companies/${id}`)
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/companies')
}
