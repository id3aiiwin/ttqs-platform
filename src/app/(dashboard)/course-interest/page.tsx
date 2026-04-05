import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CourseInterestClient } from './course-interest-client'
import { FUTURE_COURSES } from '@/lib/survey-questions'

export const metadata = { title: '課程興趣統計 | ID3A 管理平台' }

export default async function CourseInterestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin', 'hr'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const sc = createServiceClient()

  // Fetch all survey responses
  const { data: responses } = await sc
    .from('course_survey_responses')
    .select('id, survey_id, future_courses, submitted_at')

  // Fetch all course surveys
  const { data: surveys } = await sc
    .from('course_surveys')
    .select('id, course_id')

  // Fetch all courses
  const { data: courses } = await sc
    .from('courses')
    .select('id, title, company_id, start_date')

  // Fetch all companies
  const { data: companies } = await sc
    .from('companies')
    .select('id, name')
    .order('name')

  // Build lookup maps
  const surveyMap: Record<string, string> = {} // survey_id -> course_id
  ;(surveys ?? []).forEach(s => { if (s.course_id) surveyMap[s.id] = s.course_id })

  const courseMap: Record<string, { title: string; company_id: string | null; start_date: string | null }> = {}
  ;(courses ?? []).forEach(c => { courseMap[c.id] = { title: c.title, company_id: c.company_id, start_date: c.start_date } })

  const companyMap: Record<string, string> = {}
  ;(companies ?? []).forEach(c => { companyMap[c.id] = c.name })

  // --- Compute Overall Ranking ---
  const overallCounts: Record<string, number> = {}
  FUTURE_COURSES.forEach(fc => { overallCounts[fc] = 0 })

  let totalResponsesWithSelection = 0
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let thisMonthResponses = 0

  // Per-company counts
  const perCompanyCounts: Record<string, Record<string, number>> = {} // companyId -> { course: count }

  // Monthly trend: last 12 months
  const monthKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthlyCounts: Record<string, Record<string, number>> = {} // month -> { course: count }
  monthKeys.forEach(mk => {
    monthlyCounts[mk] = {}
    FUTURE_COURSES.forEach(fc => { monthlyCounts[mk]![fc] = 0 })
  })

  ;(responses ?? []).forEach(r => {
    const fc = (r.future_courses ?? []) as string[]
    if (fc.length === 0) return

    totalResponsesWithSelection++

    // Determine month
    const submittedAt = r.submitted_at ? r.submitted_at.slice(0, 7) : null
    if (submittedAt === currentMonth) thisMonthResponses++

    // Determine company via survey -> course -> company
    const courseId = surveyMap[r.survey_id]
    const course = courseId ? courseMap[courseId] : null
    const companyId = course?.company_id ?? null

    fc.forEach(courseName => {
      // Overall
      if (overallCounts[courseName] !== undefined) {
        overallCounts[courseName]!++
      }

      // Per company
      if (companyId) {
        if (!perCompanyCounts[companyId]) {
          perCompanyCounts[companyId] = {}
          FUTURE_COURSES.forEach(f => { perCompanyCounts[companyId]![f] = 0 })
        }
        if (perCompanyCounts[companyId]![courseName] !== undefined) {
          perCompanyCounts[companyId]![courseName]!++
        }
      }

      // Monthly trend
      if (submittedAt && monthlyCounts[submittedAt]) {
        if (monthlyCounts[submittedAt]![courseName] !== undefined) {
          monthlyCounts[submittedAt]![courseName]!++
        }
      }
    })
  })

  // Sort overall ranking
  const overallRanking = FUTURE_COURSES
    .map(name => ({ name, count: overallCounts[name] ?? 0 }))
    .sort((a, b) => b.count - a.count)

  // Top 5 for trend
  const top5 = overallRanking.slice(0, 5).map(r => r.name)

  // Trend data: for top 5, show counts per month
  const trendData = monthKeys.map(mk => {
    const entry: Record<string, number> = {}
    top5.forEach(name => { entry[name] = monthlyCounts[mk]?.[name] ?? 0 })
    return { month: mk, ...entry }
  })

  // Per-company data
  const perCompanyData: Record<string, { name: string; ranking: { name: string; count: number }[] }> = {}
  Object.entries(perCompanyCounts).forEach(([cid, counts]) => {
    perCompanyData[cid] = {
      name: companyMap[cid] ?? '未知',
      ranking: FUTURE_COURSES
        .map(name => ({ name, count: counts[name] ?? 0 }))
        .sort((a, b) => b.count - a.count),
    }
  })

  // Company options for dropdown
  const companyOptions = (companies ?? []).map(c => ({ id: c.id, name: c.name }))

  // Unique company count from responses
  const companyIdsInResponses = new Set<string>()
  ;(responses ?? []).forEach(r => {
    const courseId = surveyMap[r.survey_id]
    const course = courseId ? courseMap[courseId] : null
    if (course?.company_id) companyIdsInResponses.add(course.company_id)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">課程興趣統計</h1>
      <p className="text-gray-500 text-sm mb-6">
        彙整所有問卷回覆中「未來期待課程」的興趣分布與趨勢
      </p>
      <CourseInterestClient
        overallRanking={overallRanking}
        perCompanyData={perCompanyData}
        companyOptions={companyOptions}
        trendData={trendData}
        top5={top5}
        monthKeys={monthKeys}
        totalResponses={totalResponsesWithSelection}
        thisMonthResponses={thisMonthResponses}
        companyCount={companyIdsInResponses.size}
      />
    </div>
  )
}
