import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { LifeCoachesClient } from './life-coaches-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '生命教練 | ID3A 管理平台' }

export default async function LifeCoachesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [profilesRes, casesRes] = await Promise.all([
    sc.from('profiles').select('id, full_name, email, role, roles, company_id, analyst_level').order('created_at', { ascending: false }),
    sc.from('analyst_cases').select('id, analyst_id, case_title, case_date, case_type, status, client_name').order('created_at', { ascending: false }),
  ])

  const allProfiles = profilesRes.data ?? []
  const analysts = allProfiles.filter(
    p => (Array.isArray(p.roles) && p.roles.includes('analyst')) || p.role === 'analyst'
  )

  const cases = casesRes.data ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">生命教練</h1>
      <p className="text-gray-500 text-sm mb-6">管理所有生命教練的資歷與個案紀錄</p>
      <LifeCoachesClient analysts={analysts} cases={cases} />
    </div>
  )
}
