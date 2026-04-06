'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { PDDRO_DEFAULT_FORMS } from '@/lib/pddro-defaults'
import { PDDRO_FORM_SCHEMAS } from '@/lib/pddro-form-schemas'
import { initCompanyTemplates } from '@/app/(dashboard)/companies/[id]/templates/actions'
import { getUser } from '@/lib/get-user'

const courseSchema = z.object({
  title: z.string().min(1, '課程名稱為必填'),
  company_id: z.string().optional(),
  course_type: z.enum(['enterprise', 'public']).default('enterprise'),
  description: z.string().optional(),
  status: z.enum(['draft', 'planned', 'in_progress', 'completed', 'cancelled']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  hours: z.string().optional(),
  trainer: z.string().optional(),
  budget: z.string().optional(),
  default_fee: z.string().optional(),
}).refine(data => data.course_type === 'public' || (data.company_id && data.company_id.length > 0), {
  message: '企業內訓必須選擇企業',
  path: ['company_id'],
})

type FormState = { error?: string; fieldErrors?: Record<string, string> } | null

export async function createCourse(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser()
  if (!user) return { error: '請先登入' }

  const raw = Object.fromEntries(
    ['title', 'company_id', 'course_type', 'description', 'status',
     'start_date', 'end_date', 'hours', 'trainer', 'budget', 'default_fee']
      .map((k) => [k, formData.get(k) || undefined])
  )

  const result = courseSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach((e) => {
      if (e.path[0]) fieldErrors[e.path[0] as string] = e.message
    })
    return { fieldErrors }
  }

  const d = result.data
  const serviceClient = createServiceClient()

  const isPublic = d.course_type === 'public'

  // 建立課程
  const { data: course, error } = await serviceClient.from('courses').insert({
    title: d.title,
    company_id: isPublic ? null : (d.company_id || null),
    course_type: d.course_type,
    description: d.description || null,
    status: d.status,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    hours: d.hours ? parseFloat(d.hours) : null,
    trainer: d.trainer || null,
    budget: d.budget ? parseFloat(d.budget) : null,
    created_by: user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // 企業內訓才複製 PDDRO 模板
  if (!isPublic && d.company_id) {
  // 確保企業有模板（沒有則自動用公版初始化）
  await initCompanyTemplates(d.company_id)

  // 從企業模板複製表單到課程
  const { data: templates } = await serviceClient
    .from('company_form_templates')
    .select('*')
    .eq('company_id', d.company_id)
    .order('pddro_phase')
    .order('sort_order')

  if (templates && templates.length > 0) {
    const forms = templates.map((t) => {
      // 快照 field_schema：優先用企業自訂，否則用系統預設
      const fieldSchema = t.field_schema
        ?? (t.standard_name && PDDRO_FORM_SCHEMAS[t.standard_name]
          ? (PDDRO_FORM_SCHEMAS[t.standard_name] as unknown as Record<string, unknown>)
          : null)

      return {
        course_id: course.id,
        pddro_phase: t.pddro_phase,
        name: t.name,
        standard_name: t.standard_name,
        ttqs_indicator: t.ttqs_indicator,
        form_type: t.form_type,
        sort_order: t.sort_order,
        template_id: t.id,
        field_schema: fieldSchema,
      }
    })
    await serviceClient.from('course_forms').insert(forms)
  }
  } // end if !isPublic

  // 自動建立課後問卷
  await serviceClient.from('course_surveys').insert({
    course_id: course.id,
    is_active: true,
  })

  redirect('/courses?selected=' + course.id)
}

export async function updateCourse(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const serviceClient = createServiceClient()

  const raw = Object.fromEntries(
    ['title', 'company_id', 'description', 'status',
     'start_date', 'end_date', 'hours', 'trainer', 'budget']
      .map((k) => [k, formData.get(k) || undefined])
  )

  const result = courseSchema.safeParse(raw)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach((e) => {
      if (e.path[0]) fieldErrors[e.path[0] as string] = e.message
    })
    return { fieldErrors }
  }

  const d = result.data
  const { error } = await serviceClient.from('courses').update({
    title: d.title,
    company_id: d.company_id,
    description: d.description || null,
    status: d.status,
    start_date: d.start_date || null,
    end_date: d.end_date || null,
    hours: d.hours ? parseFloat(d.hours) : null,
    trainer: d.trainer || null,
    budget: d.budget ? parseFloat(d.budget) : null,
  }).eq('id', id)

  if (error) return { error: error.message }
  redirect(`/courses/${id}`)
}

export async function deleteCourse(id: string) {
  const serviceClient = createServiceClient()
  await serviceClient.from('courses').delete().eq('id', id)
  redirect('/courses')
}

export async function duplicateCourse(sourceId: string) {
  const user = await getUser()
  if (!user) return

  const serviceClient = createServiceClient()

  const { data: source } = await serviceClient
    .from('courses')
    .select('title, company_id, course_type, description, status, hours, trainer, budget, default_fee')
    .eq('id', sourceId)
    .single()

  if (!source) return

  const { data: newCourse } = await serviceClient.from('courses').insert({
    title: `${source.title}（複製）`,
    company_id: source.company_id,
    course_type: source.course_type ?? 'enterprise',
    description: source.description,
    status: 'draft',
    hours: source.hours,
    trainer: source.trainer,
    budget: source.budget,
    default_fee: source.default_fee,
    created_by: user.id,
  }).select('id').single()

  if (!newCourse) return

  // 複製 PDDRO 表單結構（不複製填寫內容）
  if (source.company_id) {
    const { data: forms } = await serviceClient
      .from('course_forms')
      .select('pddro_phase, name, standard_name, ttqs_indicator, form_type, sort_order, template_id, field_schema')
      .eq('course_id', sourceId)

    if (forms && forms.length > 0) {
      await serviceClient.from('course_forms').insert(
        forms.map(f => ({ ...f, course_id: newCourse.id }))
      )
    }
  }

  // 自動建立課後問卷
  await serviceClient.from('course_surveys').insert({
    course_id: newCourse.id,
    is_active: true,
  })

  redirect('/courses?selected=' + newCourse.id)
}
