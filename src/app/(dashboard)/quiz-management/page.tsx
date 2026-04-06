import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { QuizManagementClient } from './quiz-management-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '測驗管理 | ID3A 管理平台' }

export default async function QuizManagementPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: quizzes } = await sc.from('quizzes').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">測驗管理</h1>
      <p className="text-gray-500 text-sm mb-6">建立內部測驗題庫，學員可在線上作答</p>
      <QuizManagementClient quizzes={quizzes ?? []} />
    </div>
  )
}
