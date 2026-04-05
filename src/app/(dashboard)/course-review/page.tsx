import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CourseReviewClient } from './course-review-client'

export const metadata = { title: '課程審核 | ID3A 管理平台' }

export default async function CourseReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) redirect('/dashboard')

  const sc = createServiceClient()

  const [pendingRes, recentRes, companiesRes] = await Promise.all([
    sc.from('courses').select('id, title, status, start_date, hours, trainer, company_id, review_status, created_at').eq('review_status', 'pending').order('created_at', { ascending: false }),
    sc.from('courses').select('id, title, status, start_date, hours, trainer, company_id, review_status, created_at').in('review_status', ['approved', 'rejected']).order('created_at', { ascending: false }).limit(20),
    sc.from('companies').select('id, name'),
  ])

  const pending = pendingRes.data ?? []
  const recent = recentRes.data ?? []
  const companyMap: Record<string, string> = {}
  ;(companiesRes.data ?? []).forEach(c => { companyMap[c.id] = c.name })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">課程審核</h1>
      <p className="text-gray-500 text-sm mb-6">審核待確認的課程，檢視近期審核紀錄</p>
      <CourseReviewClient pending={pending} recent={recent} companyMap={companyMap} />
    </div>
  )
}
