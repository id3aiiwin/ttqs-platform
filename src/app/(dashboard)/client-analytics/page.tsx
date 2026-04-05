import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { ClientAnalyticsClient } from './client-analytics-client'

export const metadata = { title: '客戶經營分析 | ID3A 管理平台' }

export default async function ClientAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  // 所有企業
  const { data: companies } = await sc.from('companies').select('id, name, status, industry, contact_person, annual_settings, created_at').order('name')

  // 所有課程（營收+滿意度）
  const { data: courses } = await sc.from('courses').select('id, company_id, title, start_date, total_revenue, status, course_type, created_at')

  // 所有互動紀錄
  const { data: interactions } = await sc.from('interactions').select('target_id, contact_date')

  // 所有問卷（滿意度趨勢）
  const { data: surveys } = await sc.from('course_surveys').select('course_id, custom_questions')

  // 整理每家企業的數據
  const companyAnalytics = (companies ?? []).map(company => {
    const companyCourses = (courses ?? []).filter(c => c.company_id === company.id)
    const companyInteractions = (interactions ?? []).filter(i => i.target_id === company.id)

    const totalRevenue = companyCourses.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    const courseCount = companyCourses.length
    const lastCourseDate = companyCourses.filter(c => c.start_date).sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))[0]?.start_date
    const lastContactDate = companyInteractions.sort((a, b) => b.contact_date.localeCompare(a.contact_date))[0]?.contact_date
    const firstDealDate = companyCourses.filter(c => c.start_date).sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))[0]?.start_date

    // 活躍度
    const today = new Date()
    const lastActivity = lastCourseDate || lastContactDate
    let activityLevel: 'active' | 'warning' | 'inactive' = 'inactive'
    if (lastActivity) {
      const daysSince = Math.floor((today.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince <= 90) activityLevel = 'active'
      else if (daysSince <= 180) activityLevel = 'warning'
    }

    // 合約到期
    const settings = (company.annual_settings ?? {}) as Record<string, unknown>
    const contractEnd = settings.contractEndDate as string | null

    return {
      id: company.id,
      name: company.name,
      status: company.status,
      industry: company.industry,
      totalRevenue,
      courseCount,
      firstDealDate,
      lastCourseDate,
      lastContactDate,
      activityLevel,
      contractEnd,
    }
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">客戶經營分析</h1>
      <p className="text-gray-500 text-sm mb-6">掌握客戶活躍度、營收貢獻、合約狀態</p>
      <ClientAnalyticsClient companies={companyAnalytics} />
    </div>
  )
}
