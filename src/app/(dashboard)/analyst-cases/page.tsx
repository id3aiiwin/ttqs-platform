import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { AnalystDashboard } from '@/components/dashboard/analyst-dashboard'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '分析師個案管理 | ID3A 管理平台' }

export default async function AnalystCasesPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const roles = profile.roles?.length > 0 ? profile.roles : [profile.role]
  if (!roles.includes('analyst') && !roles.includes('consultant')) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: cases } = await sc.from('analyst_cases')
    .select('id, case_title, case_date, case_type, status, client_name')
    .eq('analyst_id', user.id)
    .order('created_at', { ascending: false })

  const { count } = await sc.from('analyst_cases')
    .select('id', { count: 'exact', head: true })
    .eq('analyst_id', user.id)

  const typedCases = (cases ?? []).map(c => ({
    ...c,
    case_type: c.case_type ?? '',
    status: c.status ?? '',
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <AnalystDashboard profile={profile} cases={typedCases} caseCount={count ?? 0} />
    </div>
  )
}
