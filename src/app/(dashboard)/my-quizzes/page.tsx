import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { MyQuizzesClient } from './my-quizzes-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '測驗紀錄 | ID3A 管理平台' }

export default async function MyQuizzesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()

  const { data: attempts } = await sc
    .from('quiz_attempts')
    .select('id, quiz_id, answers, score, total, percentage, passed, completed_at')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  const quizIds = [...new Set((attempts ?? []).map(a => a.quiz_id))]
  const { data: quizzes } = quizIds.length > 0
    ? await sc.from('quizzes').select('id, title').in('id', quizIds)
    : { data: [] as { id: string; title: string }[] }

  const quizMap = new Map((quizzes ?? []).map(q => [q.id, q.title]))

  const mapped = (attempts ?? []).map(a => ({
    id: a.id,
    quiz_id: a.quiz_id,
    quiz_title: quizMap.get(a.quiz_id) ?? '未知測驗',
    answers: a.answers as unknown[] | null,
    score: a.score ?? 0,
    total: a.total ?? 0,
    percentage: a.percentage ?? 0,
    passed: a.passed,
    completed_at: a.completed_at,
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">測驗紀錄</h1>
      <MyQuizzesClient attempts={mapped} />
    </div>
  )
}
