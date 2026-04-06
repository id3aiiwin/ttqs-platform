import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { RoleManagementClient } from './role-management-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '角色管理 | ID3A 管理平台' }

export default async function RoleManagementPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: allUsers } = await sc.from('profiles')
    .select('id, full_name, email, role, roles, company_id, instructor_level, analyst_level')
    .order('created_at', { ascending: false })

  const { data: companies } = await sc.from('companies').select('id, name').order('name')
  const companyMap: Record<string, string> = {}
  companies?.forEach(c => { companyMap[c.id] = c.name })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">角色管理</h1>
      <p className="text-gray-500 text-sm mb-6">管理所有使用者的角色與權限</p>
      <RoleManagementClient users={allUsers ?? []} companyMap={companyMap} companies={companies ?? []} />
    </div>
  )
}
