import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { AuditLogClient } from './audit-log-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '操作紀錄 | ID3A 管理平台' }

export default async function AuditLogPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: logs } = await sc.from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">操作紀錄</h1>
      <p className="text-gray-500 text-sm mb-6">檢視系統中所有重要操作的稽核紀錄</p>
      <AuditLogClient initialLogs={logs ?? []} />
    </div>
  )
}
