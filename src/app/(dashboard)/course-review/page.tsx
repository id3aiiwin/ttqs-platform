import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CourseReviewClient } from './course-review-client'

export const metadata = { title: '課程審核 | ID3A 管理平台' }

export default async function CourseReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || profile.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()

  const [pendingRes, recentRes, companiesRes] = await Promise.all([
    sc.from('courses')
      .select('id, title, status, start_date, hours, trainer, company_id, review_status, material_submit_date, created_at')
      .eq('review_status', 'pending')
      .order('created_at', { ascending: false }),
    sc.from('courses')
      .select('id, title, status, start_date, hours, trainer, company_id, review_status, material_submit_date, created_at')
      .in('review_status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(20),
    sc.from('companies').select('id, name'),
  ])

  const allCourseIds = [...(pendingRes.data ?? []), ...(recentRes.data ?? [])].map(c => c.id)

  // Fetch survey satisfaction data for these courses
  const { data: surveys } = allCourseIds.length > 0
    ? await sc.from('course_surveys').select('id, course_id').in('course_id', allCourseIds)
    : { data: [] }

  const surveyIds = (surveys ?? []).map(s => s.id)
  const { data: responses } = surveyIds.length > 0
    ? await sc.from('course_survey_responses')
        .select('survey_id, learning_effect_scores, course_scores, instructor_scores, venue_scores')
        .in('survey_id', surveyIds)
    : { data: [] }

  // Compute satisfaction per course
  const surveyByCourse: Record<string, string> = {}
  ;(surveys ?? []).forEach(s => { surveyByCourse[s.course_id] = s.id })

  const satisfactionMap: Record<string, { le: number; ce: number; ie: number; ve: number; overall: number; count: number }> = {}
  for (const courseId of allCourseIds) {
    const sid = surveyByCourse[courseId]
    if (!sid) continue
    const courseResponses = (responses ?? []).filter(r => r.survey_id === sid)
    if (courseResponses.length === 0) continue

    let totalLe = 0, totalCe = 0, totalIe = 0, totalVe = 0
    let cLe = 0, cCe = 0, cIe = 0, cVe = 0

    courseResponses.forEach(r => {
      const le = (r.learning_effect_scores as number[]) ?? []
      const ce = (r.course_scores as number[]) ?? []
      const ie = (r.instructor_scores as number[]) ?? []
      const ve = (r.venue_scores as number[]) ?? []
      le.forEach(v => { totalLe += v; cLe++ })
      ce.forEach(v => { totalCe += v; cCe++ })
      ie.forEach(v => { totalIe += v; cIe++ })
      ve.forEach(v => { totalVe += v; cVe++ })
    })

    const leAvg = cLe > 0 ? totalLe / cLe : 0
    const ceAvg = cCe > 0 ? totalCe / cCe : 0
    const ieAvg = cIe > 0 ? totalIe / cIe : 0
    const veAvg = cVe > 0 ? totalVe / cVe : 0
    const allTotal = totalLe + totalCe + totalIe + totalVe
    const allCount = cLe + cCe + cIe + cVe

    satisfactionMap[courseId] = {
      le: Math.round(leAvg * 100) / 100,
      ce: Math.round(ceAvg * 100) / 100,
      ie: Math.round(ieAvg * 100) / 100,
      ve: Math.round(veAvg * 100) / 100,
      overall: allCount > 0 ? Math.round((allTotal / allCount) * 100) / 100 : 0,
      count: courseResponses.length,
    }
  }

  const companyMap: Record<string, string> = {}
  ;(companiesRes.data ?? []).forEach(c => { companyMap[c.id] = c.name })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">課程審核</h1>
      <p className="text-gray-500 text-sm mb-6">審核待確認的課程</p>
      <CourseReviewClient
        pending={pendingRes.data ?? []}
        recent={recentRes.data ?? []}
        companyMap={companyMap}
        satisfactionMap={satisfactionMap}
      />
    </div>
  )
}
