import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { CourseForm } from '@/components/course/course-form'
import { createCourse } from '../actions'

export const metadata = { title: '新增課程 | ID3A 管理平台' }

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; template?: string }>
}) {
  const { company: defaultCompanyId, template: templateId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const serviceClient = createServiceClient()

  const [{ data: companies }, { data: templates }] = await Promise.all([
    serviceClient.from('companies').select('id, name').order('name'),
    serviceClient.from('course_templates_v2').select('id, name, course_type, hours, description, default_fee').order('name'),
  ])

  // 查詢各企業待確認的模板數量
  const { data: pendingRows } = await serviceClient
    .from('company_form_templates')
    .select('company_id')
    .eq('needs_customization', true)
    .eq('is_confirmed', false)

  const pendingTemplatesByCompany: Record<string, number> = {}
  pendingRows?.forEach((r) => {
    pendingTemplatesByCompany[r.company_id] = (pendingTemplatesByCompany[r.company_id] ?? 0) + 1
  })

  // 從模板帶入預設值
  const selectedTemplate = templateId
    ? (templates ?? []).find(t => t.id === templateId)
    : null

  const defaultValues = selectedTemplate
    ? {
        title: selectedTemplate.name,
        course_type: selectedTemplate.course_type as 'enterprise' | 'public',
        hours: selectedTemplate.hours,
        description: selectedTemplate.description,
        default_fee: selectedTemplate.default_fee,
      }
    : undefined

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/courses" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回課程列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">新增課程</h1>
      </div>

      {/* 從模板快速建立 */}
      {(templates ?? []).length > 0 && !selectedTemplate && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm font-medium text-indigo-700 mb-2">從模板快速建立</p>
          <div className="flex flex-wrap gap-2">
            {(templates ?? []).map(t => (
              <Link key={t.id} href={`/courses/new?template=${t.id}${defaultCompanyId ? `&company=${defaultCompanyId}` : ''}`}
                className="text-xs bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 transition-colors">
                {t.name}{t.hours ? ` · ${t.hours}h` : ''}{t.course_type === 'public' ? ' · 公開課' : ''}
              </Link>
            ))}
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-sm text-green-700">已從模板「{selectedTemplate.name}」帶入預設值</p>
          <Link href={`/courses/new${defaultCompanyId ? `?company=${defaultCompanyId}` : ''}`}
            className="text-xs text-green-600 hover:text-green-700 underline">清除模板</Link>
        </div>
      )}

      <Card>
        <CardHeader><p className="text-sm text-gray-500">填寫課程基本資料</p></CardHeader>
        <CardBody>
          <CourseForm
            action={createCourse}
            companies={companies ?? []}
            defaultCompanyId={defaultCompanyId}
            defaultValues={defaultValues as Record<string, unknown> | undefined}
            submitLabel="新增課程"
            pendingTemplatesByCompany={pendingTemplatesByCompany}
          />
        </CardBody>
      </Card>
    </div>
  )
}
