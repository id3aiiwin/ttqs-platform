import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { TodosClient } from './todos-client'

export const metadata = { title: '待辦事項 | ID3A 管理平台' }

export default async function TodosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()
  const isAdmin = profile.role === 'consultant' || profile.role === 'admin'

  let query = sc.from('todos').select('*').order('due_date', { ascending: true })
  if (!isAdmin) query = query.eq('assigned_to', user.id)

  const { data: todos } = await query

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">待辦事項</h1>
      <TodosClient todos={todos ?? []} isAdmin={isAdmin} />
    </div>
  )
}
