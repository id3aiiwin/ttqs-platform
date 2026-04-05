'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type FieldType = 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date'

/** 更新企業模板欄位顯示名稱 */
export async function updateTemplateFieldName(fieldId: string, displayName: string, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competency_form_templates')
    .update({ display_name: displayName })
    .eq('id', fieldId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency/templates`)
}

/** 更新欄位類型 */
export async function updateTemplateFieldType(fieldId: string, fieldType: FieldType, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competency_form_templates')
    .update({ field_type: fieldType })
    .eq('id', fieldId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency/templates`)
}

/** 切換必填 */
export async function toggleTemplateFieldRequired(fieldId: string, isRequired: boolean, companyId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competency_form_templates')
    .update({ is_required: isRequired })
    .eq('id', fieldId)
  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency/templates`)
}

/** 新增自訂欄位 */
export async function addTemplateField(
  companyId: string,
  formType: string,
  data: { fieldName: string; displayName: string; fieldType: FieldType; isRequired: boolean }
) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('competency_form_templates')
    .select('sort_order')
    .eq('company_id', companyId)
    .eq('form_type', formType as 'job_analysis')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('competency_form_templates').insert({
    company_id: companyId,
    form_type: formType as 'job_analysis',
    field_name: data.fieldName,
    display_name: data.displayName,
    field_type: data.fieldType,
    is_required: data.isRequired,
    sort_order: nextOrder,
    // default_field_id 為 null 表示自訂欄位
  })

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency/templates`)
}

/** 刪除自訂欄位（只能刪 default_field_id 為 null 的） */
export async function deleteTemplateField(fieldId: string, companyId: string) {
  const supabase = createServiceClient()

  // 確認是自訂欄位
  const { data: field } = await supabase
    .from('competency_form_templates')
    .select('default_field_id')
    .eq('id', fieldId)
    .single()

  if (field?.default_field_id) {
    return { error: '公版欄位不能刪除' }
  }

  const { error } = await supabase
    .from('competency_form_templates')
    .delete()
    .eq('id', fieldId)

  if (error) return { error: error.message }
  revalidatePath(`/companies/${companyId}/competency/templates`)
}
