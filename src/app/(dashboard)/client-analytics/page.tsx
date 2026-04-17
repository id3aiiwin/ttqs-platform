import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { ClientAnalyticsClient } from './client-analytics-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '客戶經營分析 | ID3A 管理平台' }

export default async function ClientAnalyticsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  const [
    { data: companies },
    { data: courses },
    { data: interactions },
    { data: surveys },
  ] = await Promise.all([
    sc.from('companies').select('id, name, status, industry, contact_person, annual_settings, created_at').order('name'),
    sc.from('courses').select('id, company_id, title, start_date, total_revenue, status, course_type, created_at'),
    sc.from('interactions').select('target_id, contact_date'),
    sc.from('course_surveys').select('course_id, custom_questions'),
  ])

  // O(n²) → O(n)：先建 company_id 索引，避免每家企業都跑一次 filter
  type CourseRow = NonNullable<typeof courses>[number]
  type InteractionRow = NonNullable<typeof interactions>[number]
  const coursesByCompany = new Map<string, CourseRow[]>()
  for (const c of courses ?? []) {
    if (!c.company_id) continue
    const arr = coursesByCompany.get(c.company_id)
    if (arr) arr.push(c)
    else coursesByCompany.set(c.company_id, [c])
  }
  const interactionsByTarget = new Map<string, InteractionRow[]>()
  for (const i of interactions ?? []) {
    if (!i.target_id) continue
    const arr = interactionsByTarget.get(i.target_id)
    if (arr) arr.push(i)
    else interactionsByTarget.set(i.target_id, [i])
  }

  // 整理每家企業的數據
  const companyAnalytics = (companies ?? []).map(company => {
    const companyCourses = coursesByCompany.get(company.id) ?? []
    const companyInteractions = interactionsByTarget.get(company.id) ?? []

    // 單次線性掃描代替多次 sort：累計 revenue、找最早/最晚課程與最晚互動
    let totalRevenue = 0
    let lastCourseDate: string | undefined
    let firstDealDate: string | undefined
    for (const c of companyCourses) {
      totalRevenue += c.total_revenue ?? 0
      if (c.start_date) {
        if (!lastCourseDate || c.start_date > lastCourseDate) lastCourseDate = c.start_date
        if (!firstDealDate || c.start_date < firstDealDate) firstDealDate = c.start_date
      }
    }
    const courseCount = companyCourses.length
    let lastContactDate: string | undefined
    for (const i of companyInteractions) {
      if (i.contact_date && (!lastContactDate || i.contact_date > lastContactDate)) lastContactDate = i.contact_date
    }

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
      firstDealDate: firstDealDate ?? null,
      lastCourseDate: lastCourseDate ?? null,
      lastContactDate: lastContactDate ?? null,
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
