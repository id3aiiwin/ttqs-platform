'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** 從公版文件庫載入企業文件清單（冪等） */
export async function initCompanyDocuments(companyId: string) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('company_documents')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  if (existing && existing.length > 0) return

  const { data: templates } = await supabase
    .from('document_templates')
    .select('*')
    .order('tier')
    .order('sort_order')

  if (!templates || templates.length === 0) return

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const docs = templates.map((t) => ({
    company_id: companyId,
    template_id: t.id,
    title: t.title,
    tier: t.tier,
    source: t.auto_generated_from ? 'auto_generated' as const : 'template' as const,
    linked_to_course_form: t.linked_to_course_form,
    pddro_phase: t.pddro_phase,
    auto_generated_from: t.auto_generated_from,
    ttqs_indicator: t.ttqs_indicator,
    status: 'draft' as const,
    created_by: user?.id ?? null,
  }))

  const { error } = await supabase.from('company_documents').insert(docs)
  if (error) throw new Error(error.message)

  revalidatePath(`/companies/${companyId}/documents`)
}

/** 新增自訂文件 */
export async function addDocument(
  companyId: string,
  data: { title: string; tier: number; doc_number?: string; source?: string }
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { error } = await supabase.from('company_documents').insert({
    company_id: companyId,
    title: data.title,
    tier: data.tier,
    doc_number: data.doc_number || null,
    source: (data.source as 'template' | 'upload' | 'auto_generated') || 'upload',
    created_by: user?.id ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/documents`)
}

/** 更新文件基本資訊 */
export async function updateDocument(
  documentId: string,
  companyId: string,
  data: { title?: string; doc_number?: string; version?: string; status?: string; notes?: string; file_url?: string }
) {
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.doc_number !== undefined) updateData.doc_number = data.doc_number || null
  if (data.version !== undefined) updateData.version = data.version || null
  if (data.status !== undefined) updateData.status = data.status
  if (data.notes !== undefined) updateData.notes = data.notes || null
  if (data.file_url !== undefined) updateData.file_url = data.file_url || null

  const { error } = await supabase
    .from('company_documents')
    .update(updateData)
    .eq('id', documentId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/documents`)
}

/** 刪除文件 */
export async function deleteDocument(documentId: string, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('company_documents').delete().eq('id', documentId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/documents`)
}

/** 新增版本紀錄 */
export async function addDocumentVersion(
  documentId: string,
  companyId: string,
  data: { version: string; change_note?: string }
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // 新增版本紀錄
  const { error: vErr } = await supabase.from('company_document_versions').insert({
    document_id: documentId,
    version: data.version,
    change_note: data.change_note || null,
    changed_by: user?.id ?? null,
  })
  if (vErr) return { error: vErr.message }

  // 更新文件主表版本
  await supabase.from('company_documents').update({ version: data.version }).eq('id', documentId)

  revalidatePath(`/companies/${companyId}/documents`)
}

/** 顧問新增審閱 */
export async function addDocumentReview(
  documentId: string,
  companyId: string,
  data: { status: 'needs_revision' | 'approved'; comment?: string }
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) return { error: '請先登入' }

  const { error: rErr } = await supabase.from('company_document_reviews').insert({
    document_id: documentId,
    reviewer_id: user.id,
    status: data.status,
    comment: data.comment || null,
  })
  if (rErr) return { error: rErr.message }

  // 更新文件狀態
  await supabase
    .from('company_documents')
    .update({ status: data.status === 'approved' ? 'approved' : 'draft' })
    .eq('id', documentId)

  revalidatePath(`/companies/${companyId}/documents`)
}
