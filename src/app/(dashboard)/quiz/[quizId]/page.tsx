import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { QuizTakeClient } from './quiz-take-client'

export const metadata = { title: '作答測驗 | ID3A 管理平台' }

export default async function QuizTakePage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sc = createServiceClient()
  const { data: quiz } = await sc.from('quizzes').select('*').eq('id', quizId).single()
  if (!quiz || !quiz.is_published) notFound()

  const { data: attempts } = await sc.from('quiz_attempts')
    .select('id, score, total, percentage, passed, completed_at')
    .eq('quiz_id', quizId).eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <QuizTakeClient quiz={quiz} userId={user.id} attempts={attempts ?? []} />
    </div>
  )
}
