import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InitCompetencyButton } from '@/components/competency/init-competency-button'
import { CreateEntryButton } from '@/components/competency/create-entry-button'
import { DeleteEntryButton } from '@/components/competency/delete-entry-button'
import { ResetTemplatesButton } from '@/components/competency/reset-templates-button'
import { CompetencyMatrix } from '@/components/competency/competency-matrix'

export const metadata = { title: '職能管理 | ID3A 管理平台' }

const TABS = [
  { key: 'analysis', label: '工作分析' },
  { key: 'jd', label: '工作說明書' },
  { key: 'standards', label: '職能標準' },
  { key: 'assessment', label: '職能考核' },
  { key: 'matrix', label: '職能矩陣' },
]

const FORM_TYPE_MAP: Record<string, string> = {
  analysis: 'job_analysis',
  jd: 'job_description',
  standards: 'competency_standard',
  assessment: 'competency_assessment',
}

const TAB_LABELS: Record<string, string> = {
  analysis: '工作分析',
  jd: '工作說明書',
  standards: '職能標準',
  assessment: '職能考核',
}

const ENTRY_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  in_progress: { label: '填寫中', variant: 'info' },
  submitted:   { label: '已送審', variant: 'warning' },
  reviewed:    { label: '已審閱', variant: 'info' },
  approved:    { label: '已核准', variant: 'success' },
}

export default async function CompetencyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab: activeTab = 'jd' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant' || profile?.role === 'admin'
  const isEmployee = profile?.role === 'employee' || profile?.role === 'hr' || profile?.role === 'manager'

  const serviceClient = createServiceClient()

  const { data: company } = await serviceClient.from('companies').select('id, name').eq('id', id).single()
  if (!company) notFound()

  // 檢查是否有企業模板
  const { data: templates } = await serviceClient
    .from('competency_form_templates')
    .select('id')
    .eq('company_id', id)
    .limit(1)

  const hasTemplates = templates && templates.length > 0

  // 取得所有 entries（用 service client 確保拿到全部）
  const { data: entries } = await serviceClient
    .from('competency_form_entries')
    .select('id, employee_id, form_type, status, created_at, updated_at')
    .eq('company_id', id)
    .order('created_at', { ascending: false })

  // 取得企業下所有員工（用 service client）
  const { data: employees } = await serviceClient
    .from('profiles')
    .select('id, full_name, email')
    .eq('company_id', id)

  const allPeople = [...(employees ?? [])]

  const employeeMap: Record<string, { name: string; email: string }> = {}
  allPeople.forEach((e) => {
    employeeMap[e.id] = { name: e.full_name || e.email, email: e.email }
  })

  // 篩選當前 tab 的 entries（員工只能看自己的）
  const formType = FORM_TYPE_MAP[activeTab]
  let filteredEntries = formType
    ? entries?.filter((e) => e.form_type === formType) ?? []
    : []
  if (isEmployee && !isConsultant) {
    filteredEntries = filteredEntries.filter(e => e.employee_id === user.id)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/companies/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回企業詳情
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">職能管理</h1>
            <p className="text-gray-500 text-sm mt-1">{company.name}</p>
          </div>
          {isConsultant && hasTemplates && (
            <div className="flex items-center gap-2">
              <ResetTemplatesButton companyId={id} />
              <Link
                href={`/companies/${id}/competency/templates`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5"
              >
                編輯模板
              </Link>
            </div>
          )}
        </div>
      </div>

      {!hasTemplates ? (
        <Card>
          <div className="text-center py-16 px-4">
            <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 mb-1">尚未設定職能表單模板</p>
            <p className="text-xs text-gray-400 mb-4">載入公版表單後，可依企業需求自訂欄位</p>
            {isConsultant && <InitCompetencyButton companyId={id} />}
          </div>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/companies/${id}/competency?tab=${tab.key}`}
                className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Form Tabs (analysis / jd / standards / assessment) */}
          {activeTab !== 'matrix' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{TAB_LABELS[activeTab]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{filteredEntries.length} 份</p>
                  </div>
                  {isConsultant && (
                    <CreateEntryButton
                      companyId={id}
                      formType={formType as 'job_analysis' | 'job_description' | 'competency_standard' | 'competency_assessment'}
                      people={allPeople.map((e) => ({ id: e.id, name: e.full_name || e.email }))}
                    />
                  )}
                </div>
              </CardHeader>

              {filteredEntries.length === 0 ? (
                <CardBody>
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400 mb-1">尚無{TAB_LABELS[activeTab]}</p>
                    <p className="text-xs text-gray-300">點擊右上角「+ 新增」建立第一份</p>
                  </div>
                </CardBody>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredEntries.map((entry) => {
                    const emp = employeeMap[entry.employee_id]
                    const st = ENTRY_STATUS[entry.status] ?? ENTRY_STATUS.draft
                    return (
                      <Link
                        key={entry.id}
                        href={`/companies/${id}/competency/entries/${entry.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">
                            {(emp?.name ?? '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{emp?.name ?? '未知'}</p>
                          <p className="text-xs text-gray-400">{emp?.email}</p>
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.updated_at).toLocaleDateString('zh-TW')}
                        </span>
                        {isConsultant && (
                          <DeleteEntryButton entryId={entry.id} companyId={id} employeeName={emp?.name ?? '未知'} />
                        )}
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Matrix Tab */}
          {activeTab === 'matrix' && (
            <CompetencyMatrix
              people={allPeople}
              entries={entries ?? []}
              companyId={id}
            />
          )}
        </>
      )}
    </div>
  )
}
