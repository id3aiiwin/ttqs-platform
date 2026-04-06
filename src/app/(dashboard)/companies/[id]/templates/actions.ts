'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { PDDRO_DEFAULT_FORMS } from '@/lib/pddro-defaults'
import { PDDRO_FORM_SCHEMAS } from '@/lib/pddro-form-schemas'
import { revalidatePath } from 'next/cache'
import type { FormSchema } from '@/types/form-schema'
import { getUser } from '@/lib/get-user'

type PddroPhase = 'P' | 'D' | 'DO' | 'R' | 'O'
type FormType = 'online' | 'upload' | 'auto'

/** 用公版預設表單初始化企業模板（冪等：已有則跳過） */
export async function initCompanyTemplates(companyId: string) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('company_form_templates')
    .select('id')
    .eq('company_id', companyId)
    .limit(1)

  if (existing && existing.length > 0) return

  const templates = Object.entries(PDDRO_DEFAULT_FORMS).flatMap(([phase, { items }]) =>
    items.map((item, idx) => ({
      company_id: companyId,
      pddro_phase: phase as PddroPhase,
      name: item.name,
      standard_name: item.standard_name,
      ttqs_indicator: item.ttqs_indicator,
      form_type: item.form_type,
      sort_order: idx,
      needs_customization: item.needs_customization,
    }))
  )

  const { error } = await supabase.from('company_form_templates').insert(templates)
  if (error) throw new Error(error.message)

  revalidatePath(`/companies/${companyId}/templates`)
}

/** 取得模板的 field_schema（優先企業自訂，否則系統預設） */
export async function getTemplateFieldSchema(template: {
  field_schema?: Record<string, unknown> | null
  standard_name?: string | null
}): Promise<FormSchema | null> {
  if (template.field_schema) return template.field_schema as unknown as FormSchema
  if (template.standard_name && PDDRO_FORM_SCHEMAS[template.standard_name]) {
    return PDDRO_FORM_SCHEMAS[template.standard_name]
  }
  return null
}

/** 更新模板的 field_schema */
export async function updateTemplateFieldSchema(
  templateId: string,
  fieldSchema: FormSchema | null,
  companyId: string
) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('company_form_templates')
    .update({ field_schema: fieldSchema as unknown as Record<string, unknown> })
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 重置模板欄位為系統預設（清除自訂 field_schema） */
export async function resetTemplateToDefault(templateId: string, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('company_form_templates')
    .update({ field_schema: null })
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 新增自訂模板項目 */
export async function addTemplateItem(
  companyId: string,
  pddroPhase: PddroPhase,
  name: string,
  formType: FormType
) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('company_form_templates')
    .select('sort_order')
    .eq('company_id', companyId)
    .eq('pddro_phase', pddroPhase as 'P')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('company_form_templates').insert({
    company_id: companyId,
    pddro_phase: pddroPhase,
    name,
    form_type: formType,
    sort_order: nextOrder,
  })

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 更新模板項目名稱 */
export async function updateTemplateName(templateId: string, name: string, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('company_form_templates')
    .update({ name })
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 更新模板項目類型 */
export async function updateTemplateType(templateId: string, formType: FormType, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('company_form_templates')
    .update({ form_type: formType })
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 確認模板項目（記錄確認人與時間） */
export async function confirmTemplateItem(templateId: string, companyId: string) {
  const user = await getUser()

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('company_form_templates')
    .update({
      is_confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirmed_by: user?.id ?? null,
    })
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}

/** 刪除模板項目 */
export async function deleteTemplateItem(templateId: string, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('company_form_templates')
    .delete()
    .eq('id', templateId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/templates`)
}
