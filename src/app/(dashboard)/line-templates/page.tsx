import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { LineTemplatesClient } from './line-templates-client'

export const metadata = { title: 'LINE 模板 | ID3A 管理平台' }

export default async function LineTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [{ data: templates }, { data: logs }] = await Promise.all([
    sc.from('line_message_templates').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: true }),
    sc.from('line_send_logs').select('*').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">LINE 訊息模板</h1>
      <p className="text-gray-500 text-sm mb-6">管理 LINE 通知模板與查看發送紀錄</p>
      <LineTemplatesClient initialTemplates={templates ?? []} initialLogs={logs ?? []} />
    </div>
  )
}
