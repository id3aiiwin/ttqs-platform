import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  LEARNING_EFFECT, COURSE_EVAL, INSTRUCTOR_EVAL, VENUE_EVAL,
  SECTION_LABELS,
} from '@/lib/survey-questions'

/** POST: 取得統計 + 已填分析文字 */
export async function POST(request: NextRequest) {
  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

  const sc = createServiceClient()

  const { data: survey } = await sc.from('course_surveys').select('id, custom_questions').eq('course_id', course_id).single()
  if (!survey) return NextResponse.json({ error: '此課程尚無問卷' }, { status: 404 })

  const { data: responses } = await sc.from('course_survey_responses').select('*').eq('survey_id', survey.id)
  if (!responses || responses.length === 0) {
    return NextResponse.json({ error: '尚無問卷回應' }, { status: 404 })
  }

  const count = responses.length

  function calcAvg(scores: number[]): number {
    if (scores.length === 0) return 0
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
  }

  function analyzeSection(allScores: number[][], questions: string[]) {
    return questions.map((q, i) => {
      const scores = allScores.map(s => s[i]).filter(s => s != null)
      return { question: q, avg: calcAvg(scores), count: scores.length }
    })
  }

  const learningStats = analyzeSection(responses.map(r => r.learning_effect_scores), LEARNING_EFFECT)
  const courseStats = analyzeSection(responses.map(r => r.course_scores), COURSE_EVAL)
  const instructorStats = analyzeSection(responses.map(r => r.instructor_scores), INSTRUCTOR_EVAL)
  const venueStats = analyzeSection(responses.map(r => r.venue_scores), VENUE_EVAL)

  const overallAvg = calcAvg([
    ...learningStats.map(s => s.avg),
    ...courseStats.map(s => s.avg),
    ...instructorStats.map(s => s.avg),
    ...venueStats.map(s => s.avg),
  ])

  const futureCounts: Record<string, number> = {}
  responses.forEach(r => {
    (r.future_courses as string[])?.forEach(c => {
      futureCounts[c] = (futureCounts[c] ?? 0) + 1
    })
  })
  const topFuture = Object.entries(futureCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // 取得已存的分析文字（存在 course_surveys.custom_questions 的最後一個元素）
  const customQ = survey.custom_questions as unknown[]
  const analysisObj = Array.isArray(customQ) ? customQ.find((q: unknown) => (q as Record<string, unknown>)?.__analysis_text) : null
  const analysisText = analysisObj ? ((analysisObj as Record<string, string>).__analysis_text ?? '') : ''

  return NextResponse.json({
    stats: {
      count,
      overallAvg,
      sections: {
        learning_effect: { label: SECTION_LABELS.learning_effect, avg: calcAvg(learningStats.map(s => s.avg)), items: learningStats },
        course: { label: SECTION_LABELS.course, avg: calcAvg(courseStats.map(s => s.avg)), items: courseStats },
        instructor: { label: SECTION_LABELS.instructor, avg: calcAvg(instructorStats.map(s => s.avg)), items: instructorStats },
        venue: { label: SECTION_LABELS.venue, avg: calcAvg(venueStats.map(s => s.avg)), items: venueStats },
      },
      topFutureCourses: topFuture,
    },
    analysisText,
  })
}

/** PATCH: 儲存分析文字 或 手動統計 */
export async function PATCH(request: NextRequest) {
  const { course_id, analysis_text, manual_stats } = await request.json()
  if (!course_id) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

  const sc = createServiceClient()

  const { data: survey } = await sc.from('course_surveys').select('id, custom_questions').eq('course_id', course_id).single()
  if (!survey) return NextResponse.json({ error: '找不到問卷' }, { status: 404 })

  // 存在 custom_questions 陣列中（加一個特殊 key）
  let customQ = Array.isArray(survey.custom_questions) ? [...survey.custom_questions] : []
  // 移除舊的分析
  customQ = customQ.filter((q: unknown) => !(q as Record<string, unknown>)?.__analysis_text)
  // 加入新的
  if (analysis_text) {
    customQ.push({ __analysis_text: analysis_text })
  }

  // 如果有手動統計，也存入
  if (manual_stats) {
    customQ = customQ.filter((q: unknown) => !(q as Record<string, unknown>)?.__manual_stats)
    customQ.push({ __manual_stats: manual_stats })
  }

  const { error } = await sc.from('course_surveys').update({ custom_questions: customQ }).eq('id', survey.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
