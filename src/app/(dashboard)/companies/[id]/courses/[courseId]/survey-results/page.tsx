import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LEARNING_EFFECT, COURSE_EVAL, INSTRUCTOR_EVAL, VENUE_EVAL,
  OPEN_QUESTIONS, FUTURE_COURSES, SECTION_LABELS,
} from '@/lib/survey-questions'

export const metadata = { title: '問卷統計 | ID3A 管理平台' }

/** 原始平均分（1-5） */
function avgScore(responses: Record<string, unknown>[], key: string, idx: number): number {
  const vals = responses
    .map((r) => { const arr = r[key] as number[]; return arr?.[idx] })
    .filter((v): v is number => typeof v === 'number' && v > 0)
  return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
}
/** 換算百分制 */
function toPct(raw: number): number { return Math.round((raw / 5) * 100) }
function pctColor(pct: number): string {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}
function barColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function sectionAvg(responses: Record<string, unknown>[], key: string, count: number): number {
  let total = 0; let n = 0
  for (let i = 0; i < count; i++) {
    const a = avgScore(responses, key, i)
    if (a > 0) { total += a; n++ }
  }
  return n > 0 ? Math.round((total / n) * 10) / 10 : 0
}

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string; courseId: string }> }) {
  const { id: companyId, courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant' && profile?.role !== 'hr') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: course } = await sc.from('courses').select('title').eq('id', courseId).single()
  const { data: survey } = await sc.from('course_surveys').select('id, is_active').eq('course_id', courseId).single()

  if (!survey) notFound()

  const { data: responses } = await sc.from('course_survey_responses')
    .select('*').eq('survey_id', survey.id)

  const total = responses?.length ?? 0
  const resp = (responses ?? []) as Record<string, unknown>[]

  // 未來課程統計
  const futureCounts: Record<string, number> = {}
  resp.forEach((r) => {
    const picks = r.future_courses as string[] ?? []
    picks.forEach((p) => { futureCounts[p] = (futureCounts[p] ?? 0) + 1 })
  })
  const futureRanked = FUTURE_COURSES
    .map((name) => ({ name, count: futureCounts[name] ?? 0 }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/courses?selected=${courseId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回課程
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">問卷統計結果</h1>
        <p className="text-gray-500 text-sm mt-1">{course?.title}</p>
      </div>

      {/* 回收狀況 + 百分制分數 */}
      {(() => {
        const le = sectionAvg(resp, 'learning_effect_scores', 4)
        const ce = sectionAvg(resp, 'course_scores', 6)
        const ie = sectionAvg(resp, 'instructor_scores', 10)
        const ve = sectionAvg(resp, 'venue_scores', 2)
        const overall = [le, ce, ie, ve].filter((v) => v > 0)
        const overallPct = overall.length > 0 ? toPct(overall.reduce((a, b) => a + b, 0) / overall.length) : 0
        const sections = [
          { label: SECTION_LABELS.learning_effect, raw: le },
          { label: SECTION_LABELS.course, raw: ce },
          { label: SECTION_LABELS.instructor, raw: ie },
          { label: SECTION_LABELS.venue, raw: ve },
        ]
        return (
          <>
            <div className="grid grid-cols-6 gap-3 mb-6">
              <Card><CardBody>
                <p className="text-xs text-gray-400">回收份數</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
              </CardBody></Card>
              <Card><CardBody>
                <p className="text-xs text-gray-400">綜合分數</p>
                <p className={`text-2xl font-bold mt-1 ${pctColor(overallPct)}`}>{overallPct}</p>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${barColor(overallPct)}`} style={{ width: `${overallPct}%` }} />
                </div>
              </CardBody></Card>
              {sections.map((s) => {
                const pct = toPct(s.raw)
                return (
                  <Card key={s.label}><CardBody>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${pctColor(pct)}`}>{pct}</p>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </CardBody></Card>
                )
              })}
            </div>
          </>
        )
      })()}

      {total === 0 ? (
        <Card><CardBody><p className="text-center text-gray-400 py-8">尚無問卷回覆</p></CardBody></Card>
      ) : (
        <>
          {/* 各題分數 */}
          <ScoreSection title={SECTION_LABELS.learning_effect} questions={LEARNING_EFFECT}
            responses={resp} scoreKey="learning_effect_scores" color="bg-blue-500" />
          <ScoreSection title={SECTION_LABELS.course} questions={COURSE_EVAL}
            responses={resp} scoreKey="course_scores" color="bg-purple-500" />
          <ScoreSection title={SECTION_LABELS.instructor} questions={INSTRUCTOR_EVAL}
            responses={resp} scoreKey="instructor_scores" color="bg-green-500" />
          <ScoreSection title={SECTION_LABELS.venue} questions={VENUE_EVAL}
            responses={resp} scoreKey="venue_scores" color="bg-amber-500" />

          {/* 簡答題 */}
          <Card className="mb-6">
            <CardHeader><p className="font-semibold text-gray-900">開放式回答</p></CardHeader>
            <CardBody>
              {OPEN_QUESTIONS.map((q) => (
                <div key={q.key} className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{q.label}</p>
                  <div className="flex flex-col gap-1">
                    {resp.map((r, i) => {
                      const ans = (r.open_answers as Record<string, string>)?.[q.key]
                      return ans ? (
                        <p key={i} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5">{ans}</p>
                      ) : null
                    }).filter(Boolean)}
                    {resp.every((r) => !(r.open_answers as Record<string, string>)?.[q.key]) && (
                      <p className="text-xs text-gray-400">無回答</p>
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* 未來期待課程 */}
          <Card className="mb-6">
            <CardHeader><p className="font-semibold text-gray-900">未來期待課程排序</p></CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2">
                {futureRanked.filter((f) => f.count > 0).map((f, i) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-400 w-6 text-right">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-700">{f.name}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(f.count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{f.count} 票</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

function ScoreSection({ title, questions, responses, scoreKey }: {
  title: string; questions: string[]; responses: Record<string, unknown>[]
  scoreKey: string; color?: string
}) {
  return (
    <Card className="mb-6">
      <CardHeader><p className="font-semibold text-gray-900">{title}</p></CardHeader>
      <CardBody>
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => {
            const avg = avgScore(responses, scoreKey, i)
            const pct = toPct(avg)
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 flex-1">{i + 1}. {q}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className={`${barColor(pct)} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-sm font-mono w-10 text-right font-medium ${pctColor(pct)}`}>{pct}</span>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
