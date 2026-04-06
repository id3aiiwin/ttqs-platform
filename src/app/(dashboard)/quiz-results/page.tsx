import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { QuizResultsClient } from './quiz-results-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '測驗紀錄管理 | ID3A 管理平台' }

export default async function QuizResultsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [quizzesRes, profilesRes, attemptsRes] = await Promise.all([
    sc.from('quizzes').select('id, title, pass_score, questions').order('title'),
    sc.from('profiles').select('id, full_name, email').order('full_name'),
    sc.from('quiz_attempts')
      .select('*, profiles!quiz_attempts_user_id_fkey(full_name, email), quizzes!quiz_attempts_quiz_id_fkey(title, pass_score)')
      .order('completed_at', { ascending: false })
      .limit(100),
  ])

  const quizzes = (quizzesRes.data ?? []).map(q => ({
    id: q.id,
    title: q.title,
    pass_score: Number(q.pass_score) || 60,
    total_points: Array.isArray(q.questions)
      ? (q.questions as { points?: number }[]).reduce((sum, qn) => sum + (qn.points || 0), 0)
      : 100,
  }))

  const profiles = (profilesRes.data ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
  }))

  const attempts = (attemptsRes.data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    quiz_id: a.quiz_id as string,
    user_id: a.user_id as string,
    score: Number(a.score) || 0,
    total: Number(a.total) || 0,
    percentage: Number(a.percentage) || 0,
    passed: a.passed as boolean,
    completed_at: a.completed_at as string,
    user_name: (a.profiles as { full_name: string | null })?.full_name ?? '(unknown)',
    user_email: (a.profiles as { email: string | null })?.email ?? '',
    quiz_title: (a.quizzes as { title: string })?.title ?? '(unknown)',
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">測驗紀錄管理</h1>
      <p className="text-gray-500 text-sm mb-6">查詢、手動輸入或匯入 LINE Bot 測驗結果</p>
      <QuizResultsClient
        quizzes={quizzes}
        profiles={profiles}
        attempts={attempts}
      />
    </div>
  )
}
