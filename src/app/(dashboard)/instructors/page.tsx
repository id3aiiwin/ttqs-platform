import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { InstructorsClient } from './instructors-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '講師資料 | ID3A 管理平台' }

export default async function InstructorsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [profilesRes, coursesRes, companiesRes] = await Promise.all([
    sc.from('profiles').select('id, full_name, email, role, roles, company_id, instructor_level, accumulated_hours, average_satisfaction').order('created_at', { ascending: false }),
    sc.from('courses').select('id, title, status, start_date, hours, trainer, company_id, review_status, is_counted_in_hours, total_revenue').order('start_date', { ascending: false }),
    sc.from('companies').select('id, name'),
  ])

  const allProfiles = profilesRes.data ?? []
  const instructors = allProfiles.filter(
    p => (Array.isArray(p.roles) && p.roles.includes('instructor')) || p.role === 'instructor'
  )

  const courses = coursesRes.data ?? []
  const companyMap: Record<string, string> = {}
  ;(companiesRes.data ?? []).forEach(c => { companyMap[c.id] = c.name })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">講師資料</h1>
      <p className="text-gray-500 text-sm mb-6">檢視所有講師的資歷、時數與滿意度</p>
      <InstructorsClient instructors={instructors} courses={courses} companyMap={companyMap} />
    </div>
  )
}
