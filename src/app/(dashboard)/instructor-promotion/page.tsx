import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { InstructorDashboard } from '@/components/dashboard/instructor-dashboard'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '講師等級管理 | ID3A 管理平台' }

export default async function InstructorPromotionPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const roles = profile.roles?.length > 0 ? profile.roles : [profile.role]
  if (!roles.includes('instructor') && !roles.includes('supervisor') && !roles.includes('consultant')) redirect('/dashboard')

  const sc = createServiceClient()
  const { data: myCourses } = await sc.from('courses')
    .select('id, title, status, start_date, hours, review_status, is_counted_in_hours')
    .eq('trainer', profile.full_name ?? '')
    .order('start_date', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <InstructorDashboard profile={profile} courses={myCourses ?? []} />
    </div>
  )
}
