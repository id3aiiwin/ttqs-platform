import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { CrmClient } from './crm-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '互動紀錄 | ID3A 管理平台' }

export default async function CrmPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()
  const [{ data: interactions }, { data: companies }] = await Promise.all([
    sc.from('interactions').select('*').order('contact_date', { ascending: false }),
    sc.from('companies').select('id, name').order('name'),
  ])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">互動紀錄</h1>
      <CrmClient interactions={interactions ?? []} companies={(companies ?? []).map(c => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
