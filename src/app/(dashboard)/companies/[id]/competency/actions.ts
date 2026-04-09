'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type CompetencyFormType = 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'

/** 從公版複製企業職能表單模板（冪等） */
export async function initCompetencyTemplates(companyId: string) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('competency_form_templates')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  if (existing && existing.length > 0) return

  const { data: defaults } = await supabase
    .from('competency_form_defaults')
    .select('*')
    .order('form_type')
    .order('sort_order')

  if (!defaults || defaults.length === 0) return

  const templates = defaults.map((d) => ({
    company_id: companyId,
    form_type: d.form_type,
    default_field_id: d.id,
    field_name: d.field_name,
    standard_name: d.standard_name,
    display_name: d.standard_name,
    field_type: d.field_type,
    is_required: d.is_required,
    options: d.options,
    sort_order: d.sort_order,
  }))

  await supabase.from('competency_form_templates').insert(templates)
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 刪除員工表單實例 */
export async function deleteFormEntry(entryId: string, companyId: string) {
  const supabase = createServiceClient()

  // 先刪除欄位值
  await supabase.from('competency_form_entry_values').delete().eq('entry_id', entryId)
  // 再刪除 entry
  const { error } = await supabase.from('competency_form_entries').delete().eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
  return {}
}

/** 重新載入公版模板（刪除舊的再重新複製） */
export async function resetCompetencyTemplates(companyId: string) {
  const supabase = createServiceClient()

  // 刪除企業現有模板
  await supabase.from('competency_form_templates').delete().eq('company_id', companyId)

  // 重新從公版複製
  const { data: defaults } = await supabase
    .from('competency_form_defaults')
    .select('*')
    .order('form_type')
    .order('sort_order')

  if (!defaults || defaults.length === 0) return

  const templates = defaults.map((d) => ({
    company_id: companyId,
    form_type: d.form_type,
    default_field_id: d.id,
    field_name: d.field_name,
    standard_name: d.standard_name,
    display_name: d.standard_name,
    field_type: d.field_type,
    is_required: d.is_required,
    options: d.options,
    sort_order: d.sort_order,
  }))

  await supabase.from('competency_form_templates').insert(templates)
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 建立員工表單實例 */
export async function createFormEntry(
  companyId: string,
  employeeId: string,
  formType: CompetencyFormType
) {
  const supabase = createServiceClient()

  // 取得企業模板欄位
  const { data: templateFields } = await supabase
    .from('competency_form_templates')
    .select('id, field_name')
    .eq('company_id', companyId)
    .eq('form_type', formType as 'job_analysis')
    .order('sort_order')

  // 建立 entry
  const { data: entry, error } = await supabase
    .from('competency_form_entries')
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      form_type: formType,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // 建立空白欄位值
  if (templateFields && templateFields.length > 0) {
    const values = templateFields.map((f) => ({
      entry_id: entry.id,
      template_field_id: f.id,
      field_name: f.field_name,
      value: null,
    }))
    await supabase.from('competency_form_entry_values').insert(values)
  }

  revalidatePath(`/companies/${companyId}/competency`)
  return { entryId: entry.id }
}

/** 更新欄位值 */
export async function updateFieldValue(
  valueId: string,
  value: unknown,
  companyId: string
) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competency_form_entry_values')
    .update({ value: value as Record<string, unknown> })
    .eq('id', valueId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 更新 entry 狀態 */
export async function updateEntryStatus(
  entryId: string,
  status: string,
  companyId: string
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const updates: Record<string, unknown> = { status }
  if (status === 'submitted') updates.submitted_at = new Date().toISOString()
  if (status === 'reviewed' || status === 'approved') {
    updates.reviewed_by = user?.id
    updates.reviewed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('competency_form_entries')
    .update(updates)
    .eq('id', entryId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency`)
}

/** 新增批閱意見 */
export async function addEntryReview(
  entryId: string,
  companyId: string,
  comment: string,
  status: 'needs_revision' | 'approved'
) {
  const supabase = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) return { error: '請先登入' }

  // 寫入審閱歷史
  await supabase.from('competency_form_reviews').insert({
    entry_id: entryId,
    reviewer_id: user.id,
    comment: comment.trim(),
    action: status,
  })

  // 更新 entry 狀態
  await supabase
    .from('competency_form_entries')
    .update({
      status: status === 'approved' ? 'approved' : 'in_progress',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', entryId)

  revalidatePath(`/companies/${companyId}/competency`)
  revalidatePath(`/companies/${companyId}/competency/entries/${entryId}`)
  return {}
}
