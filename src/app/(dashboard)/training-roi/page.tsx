import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { TrainingRoiClient } from './training-roi-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '訓練 ROI 報告 | ID3A 管理平台' }

export default async function TrainingRoiPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  const [
    { data: companies },
    { data: courses },
    { data: surveys },
    { data: registrations },
    { data: shopOrders },
  ] = await Promise.all([
    sc.from('companies').select('id, name, status, industry, annual_settings').order('name'),
    sc.from('courses').select('id, title, company_id, start_date, hours, total_revenue, status, course_type, trainer, budget'),
    sc.from('course_surveys').select('course_id, custom_questions'),
    sc.from('course_registrations').select('course_id, fee, payment_status'),
    sc.from('shop_orders').select('amount, status, created_at'),
  ])

  const now = new Date()
  const currentYear = now.getFullYear()

  // --- 每家企業 ROI ---
  const companyRoiData = (companies ?? []).map(company => {
    const companyCourses = (courses ?? []).filter(c => c.company_id === company.id)
    const totalInvestment = companyCourses.reduce((s, c) => s + (c.budget ?? 0), 0)
    const totalRevenue = companyCourses.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    const regRevenue = (registrations ?? [])
      .filter(r => companyCourses.some(c => c.id === r.course_id) && r.payment_status === 'paid')
      .reduce((s, r) => s + (r.fee ?? 0), 0)
    const courseCount = companyCourses.length
    const trainingHours = companyCourses.reduce((s, c) => s + (c.hours ?? 0), 0)

    // 滿意度平均
    let totalScore = 0; let scoreCount = 0
    companyCourses.forEach(c => {
      const survey = (surveys ?? []).find(sv => sv.course_id === c.id)
      if (survey?.custom_questions && Array.isArray(survey.custom_questions)) {
        (survey.custom_questions as unknown as Record<string, unknown>[]).forEach((q) => {
          if (typeof q.score === 'number') { totalScore += q.score; scoreCount++ }
        })
      }
    })
    const avgSatisfaction = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 10) / 10 : null

    const settings = (company.annual_settings ?? {}) as Record<string, unknown>
    const employeeCount = (settings.employeeCount as number) ?? null

    const combinedRevenue = totalRevenue + regRevenue
    const roi = totalInvestment > 0 ? Math.round((combinedRevenue - totalInvestment) / totalInvestment * 100) : 0

    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      totalInvestment,
      totalRevenue: combinedRevenue,
      courseCount,
      trainingHours,
      avgSatisfaction,
      employeeCount,
      roi,
    }
  })

  // --- 月營收趨勢（過去 12 個月） ---
  const monthlyTrend: { month: string; enterprise: number; public_: number; product: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, now.getMonth() - i, 1)
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const yy = d.getFullYear(); const mm = d.getMonth()

    const monthCourses = (courses ?? []).filter(c => {
      if (!c.start_date) return false
      const sd = new Date(c.start_date)
      return sd.getFullYear() === yy && sd.getMonth() === mm
    })

    const enterprise = monthCourses.filter(c => c.course_type === 'enterprise').reduce((s, c) => s + (c.total_revenue ?? 0), 0)
    const public_ = monthCourses.filter(c => c.course_type === 'public').reduce((s, c) => s + (c.total_revenue ?? 0), 0)

    const monthOrders = (shopOrders ?? []).filter(o => {
      if (!o.created_at || o.status !== 'paid') return false
      const od = new Date(o.created_at)
      return od.getFullYear() === yy && od.getMonth() === mm
    })
    const product = monthOrders.reduce((s, o) => s + (o.amount ?? 0), 0)

    monthlyTrend.push({ month: label, enterprise, public_, product })
  }

  // --- 總計 ---
  const allCourses = courses ?? []
  const grandRevenue = allCourses.reduce((s, c) => s + (c.total_revenue ?? 0), 0)
  const grandRegRevenue = (registrations ?? []).filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.fee ?? 0), 0)
  const grandProductRevenue = (shopOrders ?? []).filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount ?? 0), 0)
  const grandTotalRevenue = grandRevenue + grandRegRevenue + grandProductRevenue
  const grandInvestment = allCourses.reduce((s, c) => s + (c.budget ?? 0), 0)
  const grandRoi = grandInvestment > 0 ? Math.round((grandTotalRevenue - grandInvestment) / grandInvestment * 100) : 0
  const grandHours = allCourses.reduce((s, c) => s + (c.hours ?? 0), 0)

  // 營收分類
  const enterpriseRevenue = allCourses.filter(c => c.course_type === 'enterprise').reduce((s, c) => s + (c.total_revenue ?? 0), 0)
  const publicRevenue = allCourses.filter(c => c.course_type === 'public').reduce((s, c) => s + (c.total_revenue ?? 0), 0) + grandRegRevenue

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">訓練 ROI 報告</h1>
      <p className="text-gray-500 text-sm mb-6">年度訓練投資回報率與營收分析</p>
      <TrainingRoiClient
        companyRoi={companyRoiData}
        monthlyTrend={monthlyTrend}
        summary={{
          totalRevenue: grandTotalRevenue,
          totalInvestment: grandInvestment,
          roi: grandRoi,
          totalHours: grandHours,
        }}
        revenueBreakdown={{
          enterprise: enterpriseRevenue,
          public_: publicRevenue,
          product: grandProductRevenue,
        }}
        currentYear={currentYear}
      />
    </div>
  )
}
