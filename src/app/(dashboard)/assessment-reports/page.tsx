import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { AssessmentReportsClient } from './assessment-reports-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '評量報告 | ID3A 管理平台' }

export default async function AssessmentReportsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [assessmentsRes, profilesRes, companiesRes] = await Promise.all([
    sc.from('talent_assessments').select('id, profile_id, drives, assessment_date, assessment_version, created_at').order('created_at', { ascending: false }),
    sc.from('profiles').select('id, full_name, email, company_id'),
    sc.from('companies').select('id, name'),
  ])

  const assessments = assessmentsRes.data ?? []
  const profiles = profilesRes.data ?? []
  const companies = companiesRes.data ?? []

  const profileMap: Record<string, { full_name: string | null; email: string; company_id: string | null }> = {}
  profiles.forEach(p => { profileMap[p.id] = { full_name: p.full_name, email: p.email, company_id: p.company_id } })

  const companyMap: Record<string, string> = {}
  companies.forEach(c => { companyMap[c.id] = c.name })

  const enriched = assessments.map(a => ({
    ...a,
    student_name: profileMap[a.profile_id]?.full_name ?? profileMap[a.profile_id]?.email ?? '未知',
    company_id: profileMap[a.profile_id]?.company_id ?? null,
    company_name: profileMap[a.profile_id]?.company_id ? (companyMap[profileMap[a.profile_id]!.company_id!] ?? '—') : '個人',
  }))

  const companyOptions = companies.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">評量報告</h1>
      <p className="text-gray-500 text-sm mb-6">檢視所有天賦評量報告，含十大驅力與紋型分析</p>
      <AssessmentReportsClient assessments={enriched} companyOptions={companyOptions} />
    </div>
  )
}
