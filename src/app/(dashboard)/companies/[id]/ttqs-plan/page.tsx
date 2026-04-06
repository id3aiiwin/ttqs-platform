import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ALL_INDICATORS, TTQS_PHASES_ORDER, TTQS_PHASE_LABELS, getIndicatorsByPhase } from '@/lib/ttqs-indicator-guides'
import { IndicatorSection } from '@/components/ttqs-plan/indicator-section'
import { YearSelector } from '@/components/ttqs-plan/year-selector'
import { PlanActions } from '@/components/ttqs-plan/plan-actions'
import { getUser } from '@/lib/get-user'

export const metadata = { title: 'TTQS 指標填寫 | ID3A 管理平台' }

const PLAN_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  draft: { label: '草稿', variant: 'default' }, submitted: { label: '已送審', variant: 'info' },
  reviewing: { label: '審閱中', variant: 'warning' }, approved: { label: '已確認', variant: 'success' },
  locked: { label: '已鎖定', variant: 'success' },
}
const PHASE_COLORS: Record<string, string> = {
  P: 'border-l-blue-500', D: 'border-l-purple-500', DO: 'border-l-orange-500',
  R: 'border-l-yellow-500', O: 'border-l-green-500',
}

export default async function TtqsPlanPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ year?: string }> }) {
  const { id: companyId } = await params
  const { year: yearParam } = await searchParams
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const user = await getUser()
  if (!user) redirect('/auth/login')
  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'
  if (!isConsultant && profile?.role !== 'hr') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('id, name').eq('id', companyId).single()
  if (!company) notFound()

  const { data: plan } = await sc.from('company_ttqs_plans').select('*').eq('company_id', companyId).eq('year', year).single()
  const { data: indicators } = plan
    ? await sc.from('company_ttqs_indicators').select('*').eq('plan_id', plan.id).order('indicator_number')
    : { data: null }

  const indicatorIds = indicators?.map((i) => i.id) ?? []
  type Ann = { id: string; indicator_id: string; annotator_id: string; content: string; annotation_type: string; created_at: string }
  const { data: rawAnns } = indicatorIds.length > 0
    ? await sc.from('company_ttqs_annotations').select('*').in('indicator_id', indicatorIds).order('created_at', { ascending: false })
    : { data: [] }
  const annotations = (rawAnns ?? []) as Ann[]

  const { data: consultants } = await sc.from('profiles').select('id, full_name, email').eq('role', 'consultant' as never)
  const nameMap: Record<string, string> = {}
  consultants?.forEach((c) => { nameMap[c.id] = c.full_name || c.email })

  const annotsByInd: Record<string, Ann[]> = {}
  annotations.forEach((a) => { if (!annotsByInd[a.indicator_id]) annotsByInd[a.indicator_id] = []; annotsByInd[a.indicator_id].push(a) })

  // JD（指標 6）
  const { data: jdEntries } = await sc.from('competency_form_entries').select('id, status').eq('company_id', companyId).eq('form_type', 'job_description' as never)

  // 課程表單（課程佐證連結）
  const { data: courses } = await sc.from('courses').select('id, title').eq('company_id', companyId)
  const courseIds = courses?.map((c) => c.id) ?? []
  const { data: allCourseForms } = courseIds.length > 0
    ? await sc.from('course_forms').select('id, course_id, name, standard_name, status').in('course_id', courseIds)
    : { data: [] }
  const courseMap: Record<string, string> = {}
  courses?.forEach((c) => { courseMap[c.id] = c.title })

  const { data: allPlans } = await sc.from('company_ttqs_plans').select('year').eq('company_id', companyId).order('year', { ascending: false })
  const availableYears = allPlans?.map((p) => p.year) ?? []
  if (!availableYears.includes(year)) availableYears.push(year)
  availableYears.sort((a, b) => b - a)

  const isLocked = plan?.status === 'locked'
  const planStatus = plan ? PLAN_STATUS[plan.status] ?? PLAN_STATUS.draft : null
  const indicatorsByPhase = getIndicatorsByPhase()
  const totalInds = ALL_INDICATORS.length
  const approvedInds = indicators?.filter((i) => i.status === 'approved').length ?? 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${companyId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">TTQS 19 指標填寫</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <YearSelector companyId={companyId} currentYear={year} availableYears={availableYears} />
            {planStatus && <Badge variant={planStatus.variant}>{planStatus.label}</Badge>}
            <span className="text-sm text-gray-500">{approvedInds}/{totalInds} 已確認</span>
          </div>
          <PlanActions companyId={companyId} year={year} planId={plan?.id ?? null}
            planStatus={plan?.status ?? null} isConsultant={isConsultant} />
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${totalInds > 0 ? (approvedInds / totalInds) * 100 : 0}%` }} />
        </div>
      </div>

      {!plan ? (
        <Card><CardBody>
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">{year} 年尚未建立指標填寫</p>
            <p className="text-xs text-gray-300 mt-1">點擊上方「建立本年度」或「從去年匯入」開始</p>
          </div>
        </CardBody></Card>
      ) : (
        <div className="flex flex-col gap-6">
          {TTQS_PHASES_ORDER.map((phase) => {
            const phaseGuides = indicatorsByPhase[phase]
            const phaseInds = indicators?.filter((i) => phaseGuides.some((g) => g.id === i.indicator_number)) ?? []
            const phaseApproved = phaseInds.filter((i) => i.status === 'approved').length
            const phaseLabel = TTQS_PHASE_LABELS[phase]

            return (
              <div key={phase}>
                <div className={`border-l-4 ${PHASE_COLORS[phase]} pl-4 mb-3 flex items-center justify-between`}>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{phaseLabel.en}</h2>
                    <p className="text-sm text-gray-500">{phaseLabel.cn}構面 · 指標 {phaseGuides[0]?.number}~{phaseGuides[phaseGuides.length - 1]?.number}</p>
                  </div>
                  <span className="text-sm text-gray-400">{phaseApproved}/{phaseGuides.length} 已確認</span>
                </div>
                <div className="flex flex-col gap-3">
                  {phaseGuides.map((guide) => {
                    const ind = indicators?.find((i) => i.indicator_number === guide.id)
                    let courseFormData: { courseName: string; formName: string; status: string }[] | undefined
                    if (guide.courseFormLinks && allCourseForms) {
                      courseFormData = []
                      for (const fn of guide.courseFormLinks.formNames) {
                        allCourseForms.filter((f) => f.standard_name === fn || f.name === fn)
                          .forEach((m) => courseFormData!.push({ courseName: courseMap[m.course_id] ?? '?', formName: m.name, status: m.status }))
                      }
                    }
                    return (
                      <IndicatorSection key={guide.id} guide={guide} indicator={ind ?? null}
                        annotations={annotsByInd[ind?.id ?? ''] ?? []} nameMap={nameMap}
                        companyId={companyId} year={year} isLocked={isLocked} isConsultant={isConsultant}
                        jdStatus={guide.id === '6' ? { total: jdEntries?.length ?? 0, approved: jdEntries?.filter((e) => e.status === 'approved').length ?? 0 } : undefined}
                        courseFormData={courseFormData} />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
