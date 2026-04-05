import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { InstructorAnalyticsClient } from './instructor-analytics-client'

export const metadata = { title: '講師績效分析 | ID3A 管理平台' }

export default async function InstructorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  // 所有課程
  const { data: courses } = await sc.from('courses').select(
    'id, title, status, start_date, hours, trainer, company_id, review_status, is_counted_in_hours, total_revenue, course_type, material_submit_date'
  )

  // 講師 profiles（roles 含 instructor）
  const { data: instructorProfiles } = await sc.from('profiles').select(
    'id, full_name, instructor_level, accumulated_hours, average_satisfaction, roles, role'
  )

  // 問卷資料
  const { data: surveys } = await sc.from('course_surveys').select('course_id, custom_questions')

  // 企業名稱
  const { data: companies } = await sc.from('companies').select('id, name')

  // 篩選講師
  const instructors = (instructorProfiles ?? []).filter(
    p => (Array.isArray(p.roles) && p.roles.includes('instructor')) || p.role === 'instructor'
  )

  const companyMap = new Map((companies ?? []).map(c => [c.id, c.name]))
  const courseList = courses ?? []
  const surveyList = surveys ?? []

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // 近6個月 / 前6個月分界
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  // 計算每位講師績效
  const instructorData = instructors.map(inst => {
    const myCourses = courseList.filter(c => c.trainer === inst.id)
    const countedCourses = myCourses.filter(c => c.is_counted_in_hours)

    const totalCourses = myCourses.length
    const totalHours = countedCourses.reduce((s, c) => s + (c.hours ?? 0), 0)
    const totalRevenue = myCourses.reduce((s, c) => s + (c.total_revenue ?? 0), 0)

    // 本月時數
    const monthCourses = countedCourses.filter(c => c.start_date?.startsWith(thisMonth))
    const monthHours = monthCourses.reduce((s, c) => s + (c.hours ?? 0), 0)

    // 滿意度：從 course_surveys 取
    const myCourseIds = new Set(myCourses.map(c => c.id))
    const mySurveys = surveyList.filter(s => myCourseIds.has(s.course_id))
    let averageSatisfaction = inst.average_satisfaction ?? 0
    if (mySurveys.length > 0) {
      const scores: number[] = []
      for (const sv of mySurveys) {
        const q = sv.custom_questions as unknown as Record<string, unknown> | null
        if (q && typeof q === 'object') {
          const sat = (q as Record<string, unknown>).satisfaction ?? (q as Record<string, unknown>).overall_satisfaction
          if (typeof sat === 'number') scores.push(sat)
        }
      }
      if (scores.length > 0) {
        averageSatisfaction = scores.reduce((a, b) => a + b, 0) / scores.length
      }
    }

    // 教材準時率
    const coursesWithDate = myCourses.filter(c => c.start_date)
    let materialPunctuality = 0
    if (coursesWithDate.length > 0) {
      const onTime = coursesWithDate.filter(c =>
        c.material_submit_date && c.start_date && c.material_submit_date <= c.start_date
      ).length
      materialPunctuality = Math.round((onTime / coursesWithDate.length) * 100)
    }

    // 趨勢：近6月 vs 前6月
    const recentHours = countedCourses
      .filter(c => c.start_date && new Date(c.start_date) >= sixMonthsAgo)
      .reduce((s, c) => s + (c.hours ?? 0), 0)
    const priorHours = countedCourses
      .filter(c => c.start_date && new Date(c.start_date) >= twelveMonthsAgo && new Date(c.start_date) < sixMonthsAgo)
      .reduce((s, c) => s + (c.hours ?? 0), 0)
    const recentTrend = priorHours > 0
      ? Math.round(((recentHours - priorHours) / priorHours) * 100)
      : recentHours > 0 ? 100 : 0

    // 待審核
    const pendingReview = myCourses.filter(c => c.review_status === 'pending').length

    // 近期課程
    const recentCourses = myCourses
      .filter(c => c.start_date)
      .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
      .slice(0, 8)
      .map(c => ({
        id: c.id,
        title: c.title,
        startDate: c.start_date,
        companyName: companyMap.get(c.company_id ?? '') ?? '—',
        hours: c.hours ?? 0,
        status: c.status,
        courseType: c.course_type,
      }))

    return {
      id: inst.id,
      name: inst.full_name ?? '未命名',
      level: inst.instructor_level ?? 'L1',
      totalCourses,
      totalHours,
      monthHours,
      averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      totalRevenue,
      materialPunctuality,
      recentTrend,
      pendingReview,
      recentCourses,
    }
  })

  // 彙總
  const totalMonthHours = instructorData.reduce((s, i) => s + i.monthHours, 0)
  const avgSatisfaction = instructorData.length > 0
    ? Math.round((instructorData.reduce((s, i) => s + i.averageSatisfaction, 0) / instructorData.length) * 100) / 100
    : 0
  const totalPendingReview = instructorData.reduce((s, i) => s + i.pendingReview, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">講師績效分析</h1>
      <p className="text-gray-500 text-sm mb-6">追蹤講師授課時數、滿意度、營收貢獻與教材準時率</p>
      <InstructorAnalyticsClient
        instructors={instructorData}
        summary={{
          totalInstructors: instructorData.length,
          totalMonthHours,
          avgSatisfaction,
          totalPendingReview,
        }}
      />
    </div>
  )
}
