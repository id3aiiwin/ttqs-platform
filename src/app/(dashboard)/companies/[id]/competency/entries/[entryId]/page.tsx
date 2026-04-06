import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Badge } from '@/components/ui/badge'
import { EntryFormEditor } from '@/components/competency/entry-form-editor'
import { JobAnalysisForm } from '@/components/competency/job-analysis-form'
import { JobDescriptionForm } from '@/components/competency/job-description-form'
import { ReviewPanel } from '@/components/competency/review-panel'
import { getUser } from '@/lib/get-user'

const FORM_TYPE_LABELS: Record<string, string> = {
  job_analysis: '工作分析',
  job_description: '工作說明書',
  competency_standard: '職能標準',
  competency_assessment: '職能考核',
}

const FORM_TYPE_TO_TAB: Record<string, string> = {
  job_analysis: 'analysis',
  job_description: 'jd',
  competency_standard: 'standards',
  competency_assessment: 'assessment',
}

const ENTRY_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  in_progress: { label: '填寫中', variant: 'info' },
  submitted:   { label: '已送審', variant: 'warning' },
  reviewed:    { label: '已審閱', variant: 'info' },
  approved:    { label: '已核准', variant: 'success' },
}

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>
}) {
  const { id: companyId, entryId } = await params

  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant' || profile?.role === 'admin'

  const serviceClient = createServiceClient()

  // 取得 entry
  const { data: entry } = await serviceClient
    .from('competency_form_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (!entry) notFound()

  // 員工只能看自己的 entry
  if (!isConsultant && entry.employee_id !== user.id) redirect(`/companies/${companyId}/competency`)

  // 取得員工資訊
  const { data: employee } = await serviceClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', entry.employee_id)
    .single()

  // 取得模板欄位（按企業模板，帶 display_name）
  const { data: templateFields } = await serviceClient
    .from('competency_form_templates')
    .select('id, field_name, standard_name, display_name, field_type, is_required, options, sort_order')
    .eq('company_id', companyId)
    .eq('form_type', entry.form_type as 'job_analysis')
    .order('sort_order')

  // 取得欄位值
  const { data: fieldValues } = await serviceClient
    .from('competency_form_entry_values')
    .select('id, template_field_id, field_name, value')
    .eq('entry_id', entryId)

  // 組合欄位和值
  const valuesMap: Record<string, { valueId: string; value: unknown }> = {}
  fieldValues?.forEach((v) => {
    const key = v.template_field_id || v.field_name
    valuesMap[key] = { valueId: v.id, value: v.value }
  })

  const formTitle = FORM_TYPE_LABELS[entry.form_type] ?? entry.form_type
  const status = ENTRY_STATUS[entry.status] ?? ENTRY_STATUS.draft

  return (
    <div className="flex" style={{ height: 'calc(100dvh - 0px)' }}>
      {/* 左側：表單內容 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/companies/${companyId}/competency?tab=${FORM_TYPE_TO_TAB[entry.form_type] ?? 'jd'}`}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </Link>
            <div className="flex items-center gap-3 mt-3">
              <h1 className="text-xl font-bold text-gray-900">{formTitle}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {employee?.full_name || employee?.email || '未知'}
            </p>
          </div>

          {/* Form fields */}
          {entry.form_type === 'job_analysis' ? (
            <JobAnalysisForm
              entryId={entryId}
              companyId={companyId}
              fields={(templateFields ?? []).map((f) => ({
                ...f,
                description: (f.options as Record<string, unknown> | null)?.description as string | null ?? null,
              }))}
              values={(fieldValues ?? []).map((v) => ({
                id: v.id,
                field_name: v.field_name,
                value: v.value,
              }))}
              isConsultant={isConsultant}
              readOnly={entry.status === 'approved'}
            />
          ) : entry.form_type === 'job_description' ? (
            <JobDescriptionForm
              entryId={entryId}
              companyId={companyId}
              fields={(templateFields ?? []).map((f) => ({
                ...f,
                description: (f.options as Record<string, unknown> | null)?.description as string | null ?? null,
              }))}
              values={(fieldValues ?? []).map((v) => ({
                id: v.id,
                field_name: v.field_name,
                value: v.value,
              }))}
              isConsultant={isConsultant}
              readOnly={entry.status === 'approved'}
            />
          ) : (
            <EntryFormEditor
              entryId={entryId}
              companyId={companyId}
              fields={templateFields ?? []}
              valuesMap={valuesMap}
              readOnly={entry.status === 'approved'}
            />
          )}
        </div>
      </div>

      {/* 右側：批閱區 */}
      <ReviewPanel
        entryId={entryId}
        companyId={companyId}
        status={entry.status}
        isConsultant={isConsultant}
        reviewedBy={entry.reviewed_by}
        reviewedAt={entry.reviewed_at}
      />
    </div>
  )
}
