import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { MyHistoryClient } from './my-history-client'

export const metadata = { title: '學習履歷 | ID3A 管理平台' }

export default async function MyHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()

  const [enrollmentsRes, quizAttemptsRes, licensesRes] = await Promise.all([
    sc.from('course_enrollments')
      .select('id, course_id, company_id, status, completion_date, created_at')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false }),
    sc.from('quiz_attempts')
      .select('id, quiz_id, score, total, percentage, passed, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false }),
    sc.from('user_licenses')
      .select('id, product_id')
      .eq('user_id', user.id),
  ])

  const enrollments = enrollmentsRes.data ?? []
  const quizAttempts = quizAttemptsRes.data ?? []
  const licenses = licensesRes.data ?? []

  // Fetch related entities
  const courseIds = [...new Set(enrollments.map(e => e.course_id))]
  const quizIds = [...new Set(quizAttempts.map(a => a.quiz_id))]
  const productIds = [...new Set(licenses.map(l => l.product_id))]

  const [coursesRes, quizzesRes, productsRes] = await Promise.all([
    courseIds.length > 0
      ? sc.from('courses').select('id, title, start_date, hours, trainer, course_type').in('id', courseIds)
      : { data: [] as { id: string; title: string; start_date: string | null; hours: number | null; trainer: string | null; course_type: string }[] },
    quizIds.length > 0
      ? sc.from('quizzes').select('id, title').in('id', quizIds)
      : { data: [] as { id: string; title: string }[] },
    productIds.length > 0
      ? sc.from('products').select('id, title').in('id', productIds)
      : { data: [] as { id: string; title: string }[] },
  ])

  const courseMap = new Map((coursesRes.data ?? []).map(c => [c.id, c]))
  const quizMap = new Map((quizzesRes.data ?? []).map(q => [q.id, q]))
  const productMap = new Map((productsRes.data ?? []).map(p => [p.id, p]))

  // Build timeline events
  type TimelineEvent = { id: string; date: string; type: 'course' | 'quiz' | 'purchase'; title: string; details: string }
  const events: TimelineEvent[] = []

  for (const e of enrollments) {
    const course = courseMap.get(e.course_id)
    if (!course) continue
    const date = e.completion_date || e.created_at
    const parts = [course.hours ? `${course.hours}h` : '', course.trainer ? `講師：${course.trainer}` : ''].filter(Boolean).join(' · ')
    events.push({
      id: `enrollment-${e.id}`, date, type: 'course', title: course.title,
      details: parts ? `完成課程「${course.title}」· ${parts}` : `完成課程「${course.title}」`,
    })
  }

  for (const a of quizAttempts) {
    const quiz = quizMap.get(a.quiz_id)
    events.push({
      id: `quiz-${a.id}`, date: a.completed_at, type: 'quiz', title: quiz?.title ?? '測驗',
      details: `測驗「${quiz?.title ?? ''}」· ${a.score ?? 0}/${a.total ?? 0} (${a.percentage ?? 0}%) · ${a.passed ? '通過' : '未通過'}`,
    })
  }

  for (const l of licenses) {
    const product = productMap.get(l.product_id)
    events.push({
      id: `license-${l.id}`, date: '', type: 'purchase', title: product?.title ?? '產品',
      details: `購買「${product?.title ?? '產品'}」`,
    })
  }

  events.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  const totalHours = enrollments.reduce((sum, e) => sum + (courseMap.get(e.course_id)?.hours ?? 0), 0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">學習履歷</h1>
      <MyHistoryClient
        events={events}
        stats={{ totalCourses: enrollments.length, totalHours, totalQuizzes: quizAttempts.length, totalPurchases: licenses.length }}
      />
    </div>
  )
}
