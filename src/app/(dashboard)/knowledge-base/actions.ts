'use server'

import { createServiceClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTemplate(formData: FormData) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const sc = createServiceClient()

  const { error } = await sc.from('knowledge_base_templates').insert({
    name: formData.get('name') as string,
    doc_number_format: (formData.get('doc_number_format') as string) || null,
    pddro_phase: (formData.get('pddro_phase') as string) || 'general',
    document_type: (formData.get('document_type') as string) || 'tier_document',
    tier: formData.get('tier') ? Number(formData.get('tier')) : null,
    version: (formData.get('version') as string) || null,
    description: (formData.get('description') as string) || null,
    file_url: (formData.get('file_url') as string) || null,
    ttqs_indicator: (formData.get('ttqs_indicator') as string) || null,
    access_level: (formData.get('access_level') as string) || 'all',
    created_by: user?.id ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/knowledge-base')
}

export async function updateTemplate(templateId: string, formData: FormData) {
  const sc = createServiceClient()

  const updateData: Record<string, unknown> = {}
  const name = formData.get('name') as string
  if (name) updateData.name = name

  const docNum = formData.get('doc_number_format') as string
  updateData.doc_number_format = docNum || null

  const phase = formData.get('pddro_phase') as string
  if (phase) updateData.pddro_phase = phase

  const tier = formData.get('tier')
  updateData.tier = tier ? Number(tier) : null

  const version = formData.get('version') as string
  updateData.version = version || null

  const desc = formData.get('description') as string
  updateData.description = desc || null

  const indicator = formData.get('ttqs_indicator') as string
  updateData.ttqs_indicator = indicator || null

  const access = formData.get('access_level') as string
  if (access) updateData.access_level = access

  // file_url 只在有傳入時更新
  const fileUrl = formData.get('file_url') as string | null
  if (fileUrl !== null && fileUrl !== undefined) {
    updateData.file_url = fileUrl || null
  }

  const { error } = await sc.from('knowledge_base_templates').update(updateData).eq('id', templateId)

  if (error) return { error: error.message }
  revalidatePath('/knowledge-base')
}

export async function deleteTemplate(templateId: string) {
  const sc = createServiceClient()
  await sc.from('knowledge_base_templates').delete().eq('id', templateId)
  revalidatePath('/knowledge-base')
}

/** 企業套用範本到四階文件 */
export async function applyTemplateToCompany(templateId: string, companyId: string) {
  const sc = createServiceClient()

  // 取得範本和企業資料
  const { data: template } = await sc.from('knowledge_base_templates').select('*').eq('id', templateId).single()
  const { data: company } = await sc.from('companies').select('name, contact_person').eq('id', companyId).single()

  if (!template || !company) return { error: '找不到範本或企業' }

  // 取得企業代碼（doc_code 欄位在 SQL migration 後才有，用 raw query）
  const { data: companyFull } = await sc.from('companies').select('*').eq('id', companyId).single() as { data: Record<string, unknown> | null }
  const docCode = (companyFull?.doc_code as string) || ''

  // 替換文件編號中的 [企業代碼]
  let docNumber = template.doc_number_format ?? ''
  docNumber = docNumber.replace('[企業代碼]', docCode || '[請設定企業代碼]')

  // 建立企業文件
  const { error } = await sc.from('company_documents').insert({
    company_id: companyId,
    template_id: templateId,
    title: template.name,
    doc_number: docNumber,
    tier: template.tier ?? 4,
    version: template.version ?? null,
    source: 'template',
    ttqs_indicator: template.ttqs_indicator ?? null,
    notes: (template.review_reminders as { section: string; description: string }[])?.length > 0
      ? '有項目需要確認修改' : null,
  })

  if (error) return { error: error.message }

  // 記錄使用
  await sc.from('knowledge_base_usage').insert({
    template_id: templateId,
    company_id: companyId,
    used_in: 'company_document',
  })

  revalidatePath(`/companies/${companyId}/documents`)
  revalidatePath('/knowledge-base')
  return { ok: true }
}
