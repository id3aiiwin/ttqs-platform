import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrainingRecords } from '@/components/passport/training-records'
import { CompetencyRadar } from '@/components/passport/competency-radar'
import { IdpList } from '@/components/passport/idp-list'
import { CertificateList } from '@/components/passport/certificate-list'

export const metadata = { title: '學習護照 | ID3A 管理平台' }

const TABS = [
  { key: 'training', label: '訓練記錄' },
  { key: 'competency', label: '核心職能' },
  { key: 'idp', label: 'IDP 發展計畫' },
  { key: 'certs', label: '證照記錄' },
]

export default async function PassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; employeeId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id: companyId, employeeId } = await params
  const { tab: activeTab = 'training' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const sc = createServiceClient()

  // 員工資訊
  const { data: employee } = await sc.from('profiles').select('id, full_name, email, role').eq('id', employeeId).single()
  if (!employee) notFound()

  const { data: company } = await sc.from('companies').select('id, name').eq('id', companyId).single()
  if (!company) notFound()

  // 訓練記錄（透過 course_enrollments 連結員工和課程）
  const { data: enrollments } = await sc
    .from('course_enrollments')
    .select('id, status, completion_date, score, course_id')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)

  const enrolledCourseIds = enrollments?.map((e) => e.course_id) ?? []
  const { data: courses } = enrolledCourseIds.length > 0
    ? await sc.from('courses').select('id, title, status, start_date, end_date, hours, trainer').in('id', enrolledCourseIds)
    : { data: [] }

  // 組合訓練記錄
  const trainingRecords = (enrollments ?? []).map((e) => {
    const course = courses?.find((c) => c.id === e.course_id)
    return {
      id: e.id,
      title: course?.title ?? '未知課程',
      status: e.status === 'completed' ? 'completed' : course?.status ?? 'planned',
      start_date: course?.start_date ?? null,
      end_date: course?.end_date ?? null,
      hours: course?.hours ?? null,
      trainer: course?.trainer ?? null,
      enrollment_status: e.status,
    }
  })

  // 職能分數
  const { data: scores } = await sc
    .from('core_competency_scores')
    .select('*')
    .eq('employee_id', employeeId)

  // 職務要求（雷達圖第三條線）
  const { data: jobReqs } = await sc
    .from('job_competency_requirements')
    .select('competency_name, required_level')
    .eq('company_id', companyId)

  // IDP
  const { data: idps } = await sc
    .from('employee_idp')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  // 證照
  const { data: certs } = await sc
    .from('employee_certificates')
    .select('*')
    .eq('employee_id', employeeId)
    .order('issued_date', { ascending: false })

  const empName = employee.full_name || employee.email

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/companies/${companyId}/competency?tab=matrix`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-700">{empName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{empName}</h1>
            <p className="text-gray-500 text-sm">{company.name} · 學習護照</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/companies/${companyId}/employees/${employeeId}/passport?tab=${tab.key}`}
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

      {/* Tab 1: 訓練記錄 */}
      {activeTab === 'training' && (
        <TrainingRecords courses={trainingRecords} />
      )}

      {/* Tab 2: 核心職能 */}
      {activeTab === 'competency' && (
        <CompetencyRadar
          scores={scores ?? []}
          idps={idps ?? []}
          jobRequirements={jobReqs ?? []}
          companyId={companyId}
          employeeId={employeeId}
          isConsultant={isConsultant}
        />
      )}

      {/* Tab 3: IDP */}
      {activeTab === 'idp' && (
        <IdpList
          idps={idps ?? []}
          companyId={companyId}
          employeeId={employeeId}
          isConsultant={isConsultant}
        />
      )}

      {/* Tab 4: 證照 */}
      {activeTab === 'certs' && (
        <CertificateList
          certs={certs ?? []}
          companyId={companyId}
          employeeId={employeeId}
          isConsultant={isConsultant}
        />
      )}
    </div>
  )
}
