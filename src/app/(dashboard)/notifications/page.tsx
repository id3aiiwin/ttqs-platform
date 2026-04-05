import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { NotificationsClient } from './notifications-client'

export const metadata = { title: '通知中心 | ID3A 管理平台' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()
  const { data: notifications } = await sc
    .from('notifications')
    .select('id, message, icon, is_read, link, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">通知中心</h1>
      <NotificationsClient notifications={notifications ?? []} />
    </div>
  )
}
