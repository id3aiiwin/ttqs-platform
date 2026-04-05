import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { CompetencyTemplateEditor } from '@/components/competency/competency-template-editor'

export const metadata = { title: '職能表單模板 | ID3A 管理平台' }

const FORM_TABS = [
  { key: 'job_analysis', label: '工作分析' },
  { key: 'job_description', label: '工作說明書' },
  { key: 'competency_standard', label: '職能標準' },
  { key: 'competency_assessment', label: '職能考核' },
]

export default async function CompetencyTemplatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ form?: string }>
}) {
  const { id } = await params
  const { form: activeForm = 'job_analysis' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const serviceClient = createServiceClient()

  const { data: company } = await serviceClient.from('companies').select('id, name').eq('id', id).single()
  if (!company) notFound()

  const { data: fields } = await serviceClient
    .from('competency_form_templates')
    .select('*')
    .eq('company_id', id)
    .eq('form_type', activeForm as 'job_analysis')
    .order('sort_order')

  const activeLabel = FORM_TABS.find((t) => t.key === activeForm)?.label ?? ''

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}/competency`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回職能管理
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">職能表單模板</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 mb-5">
        修改模板會影響未來新建的表單實例。已建立的員工表單不受影響。
      </div>

      {/* Form Type Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {FORM_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/companies/${id}/competency/templates?form=${tab.key}`}
            className={`flex-1 text-center py-2 px-2 rounded-md text-sm font-medium transition-colors ${
              activeForm === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{activeLabel}欄位</p>
              <p className="text-xs text-gray-400 mt-0.5">{fields?.length ?? 0} 個欄位</p>
            </div>
          </div>
        </CardHeader>
        <CompetencyTemplateEditor
          companyId={id}
          formType={activeForm}
          fields={fields ?? []}
          isConsultant={isConsultant}
        />
      </Card>
    </div>
  )
}
