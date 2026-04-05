import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { getWorkspaceStats } from '@/lib/get-workspace-stats'
import { CompanyWorkspace } from '@/components/company/company-workspace'

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const stats = await getWorkspaceStats(id)

  return <CompanyWorkspace company={company} stats={stats} />
}
