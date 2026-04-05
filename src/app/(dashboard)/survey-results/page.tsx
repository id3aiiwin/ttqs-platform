import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { SurveyResultsClient } from './survey-results-client'

export const metadata = { title: '問卷總覽 | ID3A 管理平台' }

export default async function SurveyResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin', 'hr'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const sc = createServiceClient()

  // Fetch all course surveys
  const { data: surveys } = await sc
    .from('course_surveys')
    .select('id, course_id, is_active, created_at')
    .order('created_at', { ascending: false })

  // Fetch courses for info
  const courseIds = [...new Set((surveys ?? []).map(s => s.course_id).filter(Boolean) as string[])]
  const { data: courses } = courseIds.length > 0
    ? await sc.from('courses').select('id, title, start_date, trainer, company_id, course_type, status').in('id', courseIds)
    : { data: [] }

  const courseMap: Record<string, NonNullable<typeof courses>[number]> = {}
  courses?.forEach(c => { courseMap[c.id] = c })

  // Fetch all survey responses
  const surveyIds = (surveys ?? []).map(s => s.id)
  const { data: responses } = surveyIds.length > 0
    ? await sc
        .from('course_survey_responses')
        .select('id, survey_id, respondent_id, learning_effect_scores, course_scores, instructor_scores, venue_scores, open_answers, future_courses, submitted_at')
        .in('survey_id', surveyIds)
    : { data: [] }

  // Fetch companies for name map
  const companyIds = [...new Set((courses ?? []).map(c => c.company_id).filter(Boolean) as string[])]
  const { data: companies } = companyIds.length > 0
    ? await sc.from('companies').select('id, name').in('id', companyIds)
    : { data: [] }
  const { data: allCompanies } = await sc.from('companies').select('id, name').order('name')

  const companyMap: Record<string, string> = {}
  companies?.forEach(c => { companyMap[c.id] = c.name })

  // Fetch respondents for name lookup
  const respondentIds = [...new Set((responses ?? []).map(r => r.respondent_id).filter(Boolean) as string[])]
  const { data: respondents } = respondentIds.length > 0
    ? await sc.from('survey_respondents').select('id, name').in('id', respondentIds)
    : { data: [] }

  const respondentMap: Record<string, string> = {}
  respondents?.forEach(r => { respondentMap[r.id] = r.name ?? '未知' })

  // Helper: compute average of a number array
  const avg = (arr: number[] | null): number => {
    if (!arr || arr.length === 0) return 0
    return arr.reduce((s, v) => s + v, 0) / arr.length
  }

  // Compute per-survey data
  const surveyData = (surveys ?? []).map(survey => {
    const course = courseMap[survey.course_id]
    const surveyResponses = (responses ?? []).filter(r => r.survey_id === survey.id)
    const responseCount = surveyResponses.length

    // Compute overall avg across all responses (average of all 22 questions per response, then avg across responses)
    let overallAvg = 0
    const sectionAvgs = { learning: 0, course: 0, instructor: 0, venue: 0 }

    if (responseCount > 0) {
      let totalLearning = 0, totalCourse = 0, totalInstructor = 0, totalVenue = 0
      let countL = 0, countC = 0, countI = 0, countV = 0

      surveyResponses.forEach(r => {
        const ls = (r.learning_effect_scores as number[]) ?? []
        const cs = (r.course_scores as number[]) ?? []
        const is_ = (r.instructor_scores as number[]) ?? []
        const vs = (r.venue_scores as number[]) ?? []

        ls.forEach(v => { totalLearning += v; countL++ })
        cs.forEach(v => { totalCourse += v; countC++ })
        is_.forEach(v => { totalInstructor += v; countI++ })
        vs.forEach(v => { totalVenue += v; countV++ })
      })

      sectionAvgs.learning = countL > 0 ? totalLearning / countL : 0
      sectionAvgs.course = countC > 0 ? totalCourse / countC : 0
      sectionAvgs.instructor = countI > 0 ? totalInstructor / countI : 0
      sectionAvgs.venue = countV > 0 ? totalVenue / countV : 0

      const totalAll = totalLearning + totalCourse + totalInstructor + totalVenue
      const countAll = countL + countC + countI + countV
      overallAvg = countAll > 0 ? totalAll / countAll : 0
    }

    return {
      id: survey.id,
      courseId: survey.course_id,
      isActive: survey.is_active,
      createdAt: survey.created_at,
      responseCount,
      overallAvg: Math.round(overallAvg * 100) / 100,
      sectionAvgs: {
        learning: Math.round(sectionAvgs.learning * 100) / 100,
        course: Math.round(sectionAvgs.course * 100) / 100,
        instructor: Math.round(sectionAvgs.instructor * 100) / 100,
        venue: Math.round(sectionAvgs.venue * 100) / 100,
      },
      courseName: course?.title ?? '未知課程',
      courseDate: course?.start_date ?? null,
      trainer: course?.trainer ?? '-',
      companyId: course?.company_id ?? '',
      companyName: course?.company_id ? (companyMap[course.company_id] ?? '-') : '公開課',
      courseType: course?.course_type ?? '-',
      courseStatus: course?.status ?? '-',
    }
  })

  // Compute per-respondent data
  const respondentData: {
    id: string
    name: string
    surveyCount: number
    responses: {
      surveyId: string
      courseName: string
      courseDate: string | null
      companyName: string
      overallAvg: number
      sectionAvgs: { learning: number; course: number; instructor: number; venue: number }
      scores: { le: number[]; ce: number[]; ie: number[]; ve: number[] }
      openAnswers: Record<string, string>
      futureCourses: string[]
      submittedAt: string | null
    }[]
  }[] = []

  type ResponseRow = NonNullable<typeof responses>[number]
  const respondentGrouped: Record<string, ResponseRow[]> = {}
  ;(responses ?? []).forEach(r => {
    const rid = r.respondent_id
    if (!rid) return
    if (!respondentGrouped[rid]) respondentGrouped[rid] = []
    respondentGrouped[rid]!.push(r)
  })

  Object.entries(respondentGrouped).forEach(([rid, resps]) => {
    const rList = (resps ?? []).map(r => {
      const surveyInfo = surveyData.find(s => s.id === r.survey_id)
      const ls = (r.learning_effect_scores as number[]) ?? []
      const cs = (r.course_scores as number[]) ?? []
      const is_ = (r.instructor_scores as number[]) ?? []
      const vs = (r.venue_scores as number[]) ?? []
      const allScores = [...ls, ...cs, ...is_, ...vs]
      const respAvg = allScores.length > 0 ? allScores.reduce((s, v) => s + v, 0) / allScores.length : 0

      return {
        surveyId: r.survey_id,
        courseName: surveyInfo?.courseName ?? '未知課程',
        courseDate: surveyInfo?.courseDate ?? null,
        companyName: surveyInfo?.companyName ?? '-',
        overallAvg: Math.round(respAvg * 100) / 100,
        sectionAvgs: {
          learning: ls.length > 0 ? Math.round(avg(ls) * 100) / 100 : 0,
          course: cs.length > 0 ? Math.round(avg(cs) * 100) / 100 : 0,
          instructor: is_.length > 0 ? Math.round(avg(is_) * 100) / 100 : 0,
          venue: vs.length > 0 ? Math.round(avg(vs) * 100) / 100 : 0,
        },
        scores: { le: ls, ce: cs, ie: is_, ve: vs },
        openAnswers: (r.open_answers ?? {}) as Record<string, string>,
        futureCourses: (r.future_courses ?? []) as string[],
        submittedAt: r.submitted_at,
      }
    })

    respondentData.push({
      id: rid,
      name: respondentMap[rid] ?? '未知',
      surveyCount: rList.length,
      responses: rList,
    })
  })

  const companyOptions = (allCompanies ?? []).map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">問卷總覽</h1>
      <p className="text-gray-500 text-sm mb-6">查看所有課程問卷結果與學員回覆統計</p>
      <SurveyResultsClient
        surveyData={surveyData}
        respondentData={respondentData}
        companyOptions={companyOptions}
      />
    </div>
  )
}
