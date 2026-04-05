'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PDDRO_DEFAULT_FORMS } from '@/lib/pddro-defaults'
import { revalidatePath } from 'next/cache'

/** 初始化課程的 PDDRO 預設表單 */
export async function initCourseForms(courseId: string) {
  const supabase = createServiceClient()

  const forms = Object.entries(PDDRO_DEFAULT_FORMS).flatMap(([phase, { items }]) =>
    items.map((item, idx) => ({
      course_id: courseId,
      pddro_phase: phase as 'P' | 'D' | 'DO' | 'R' | 'O',
      name: item.name,
      form_type: item.form_type,
      sort_order: idx,
    }))
  )

  const { error } = await supabase.from('course_forms').insert(forms)
  if (error) throw new Error(error.message)

  revalidatePath('/courses')
}

/** 新增自訂表單項目 */
type PddroPhase = 'P' | 'D' | 'DO' | 'R' | 'O'
type FormType = 'online' | 'upload' | 'auto'

export async function addCourseForm(
  courseId: string,
  pddroPhase: PddroPhase,
  name: string,
  formType: FormType
) {
  const supabase = createServiceClient()

  // 取得目前最大 sort_order
  const { data: existing } = await supabase
    .from('course_forms')
    .select('sort_order')
    .eq('course_id', courseId)
    .eq('pddro_phase', pddroPhase as 'P')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase.from('course_forms').insert({
    course_id: courseId,
    pddro_phase: pddroPhase,
    name,
    form_type: formType,
    sort_order: nextOrder,
  })

  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
}

/** 更新表單狀態 */
export async function updateFormStatus(formId: string, status: string, courseId: string) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('course_forms')
    .update({ status: status as 'pending' | 'in_progress' | 'completed' })
    .eq('id', formId)

  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
}

/** 更新表單名稱 */
export async function updateFormName(formId: string, name: string, courseId: string) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('course_forms')
    .update({ name })
    .eq('id', formId)

  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
}

/** 刪除表單項目 */
export async function deleteCourseForm(formId: string, courseId: string) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('course_forms')
    .delete()
    .eq('id', formId)

  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
}

/** 取得表單含 field_schema 和 form_data */
export async function getFormWithSchema(formId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('course_forms')
    .select('*, courses!inner(title, company_id, start_date, end_date, hours, trainer, companies!inner(name))')
    .eq('id', formId)
    .single()

  if (error) return { error: error.message }
  return { data }
}

/** 儲存表單填寫資料 */
export async function saveFormData(formId: string, courseId: string, formData: Record<string, unknown>) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('course_forms')
    .update({
      form_data: formData,
      status: 'in_progress' as const,
    })
    .eq('id', formId)

  if (error) return { error: error.message }
  revalidatePath(`/courses/${courseId}`)
  revalidatePath(`/courses/${courseId}/forms/${formId}`)
}
