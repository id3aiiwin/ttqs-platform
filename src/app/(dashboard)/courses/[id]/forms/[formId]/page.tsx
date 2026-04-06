import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { PDDRO_FORM_SCHEMAS } from '@/lib/pddro-form-schemas'
import { FormFillingClient } from './form-filling-client'
import type { FormSchema, FormAutoPopulateContext } from '@/types/form-schema'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '表單填寫 | ID3A 管理平台' }

export default async function FormFillingPage({
  params,
}: {
  params: Promise<{ id: string; formId: string }>
}) {
  const { id: courseId, formId } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const serviceClient = createServiceClient()

  // 取得表單資料（含課程和企業資訊）
  const { data: form } = await serviceClient
    .from('course_forms')
    .select('*')
    .eq('id', formId)
    .eq('course_id', courseId)
    .single()

  if (!form) notFound()

  const { data: course } = await serviceClient
    .from('courses')
    .select('*, companies!inner(name)')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const company = course.companies as unknown as { name: string }

  // 取得 field_schema：優先用 course_forms 上的，否則用系統預設
  let schema: FormSchema | null = form.field_schema as unknown as FormSchema | null
  if (!schema && form.standard_name) {
    schema = PDDRO_FORM_SCHEMAS[form.standard_name] ?? null
  }

  if (!schema) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link href={`/courses?selected=${courseId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回課程
        </Link>
        <div className="text-center py-16">
          <p className="text-gray-500">此表單尚未設定欄位定義</p>
          <p className="text-sm text-gray-400 mt-1">請先在企業模板中編輯欄位</p>
        </div>
      </div>
    )
  }

  // 自動帶入上下文
  const autoPopulateCtx: FormAutoPopulateContext = {
    company_name: company.name,
    course_title: course.title,
    course_start_date: course.start_date ?? undefined,
    course_end_date: course.end_date ?? undefined,
    course_hours: course.hours ?? undefined,
    course_trainer: course.trainer ?? undefined,
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/courses?selected=${courseId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回課程
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        <FormFillingClient
          formId={formId}
          courseId={courseId}
          schema={schema}
          initialData={(form.form_data as Record<string, unknown>) ?? {}}
          companyName={company.name}
          autoPopulateCtx={autoPopulateCtx}
          isConsultant={profile?.role === 'consultant'}
        />
      </div>
    </div>
  )
}
