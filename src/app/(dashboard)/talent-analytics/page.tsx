import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { TalentAnalyticsClient } from './talent-analytics-client'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '皮紋評量分析 | ID3A 管理平台' }

const DRIVE_KEYS = ['行動力', '學習力', '社交力', '領導力', '執行力', '創造力', '感受力', '思維力', '分析力', '自律力'] as const

export default async function TalentAnalyticsPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) redirect('/dashboard')

  const sc = createServiceClient()

  // Fetch all data in parallel
  const [assessmentsRes, profilesRes, companiesRes, casesRes] = await Promise.all([
    sc.from('talent_assessments').select('id, profile_id, drives, assessment_date, assessment_version, created_at'),
    sc.from('profiles').select('id, full_name, email, company_id, role, roles'),
    sc.from('companies').select('id, name'),
    sc.from('analyst_cases').select('id, analyst_id, case_type, status, client_name'),
  ])

  const assessments = assessmentsRes.data ?? []
  const profiles = profilesRes.data ?? []
  const companies = companiesRes.data ?? []
  const cases = casesRes.data ?? []

  // Total assessments
  const totalAssessments = assessments.length

  // Assessments per month (last 12 months)
  const now = new Date()
  const monthlyTrend: { month: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = assessments.filter(a => {
      const date = a.assessment_date || a.created_at
      return date && date.startsWith(key)
    }).length
    const label = `${d.getMonth() + 1}月`
    monthlyTrend.push({ month: label, count })
  }

  // This month count
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthCount = assessments.filter(a => {
    const date = a.assessment_date || a.created_at
    return date && date.startsWith(currentMonthKey)
  }).length

  // Pattern type distribution (pattern is stored in each drive object)
  const patternMap: Record<string, number> = {}
  for (const a of assessments) {
    const drivesArr = a.drives as { name: string; percentage: number; pattern: string }[] | null
    if (drivesArr && drivesArr.length > 0 && drivesArr[0].pattern) {
      const pt = drivesArr[0].pattern
      patternMap[pt] = (patternMap[pt] ?? 0) + 1
    }
  }
  const patternDistribution = Object.entries(patternMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Drive averages
  const driveTotals: Record<string, { sum: number; count: number }> = {}
  for (const key of DRIVE_KEYS) {
    driveTotals[key] = { sum: 0, count: 0 }
  }
  for (const a of assessments) {
    const drivesArr = a.drives as { name: string; percentage: number; pattern: string }[] | null
    if (!drivesArr || !Array.isArray(drivesArr)) continue
    for (const d of drivesArr) {
      if (DRIVE_KEYS.includes(d.name as typeof DRIVE_KEYS[number]) && typeof d.percentage === 'number') {
        driveTotals[d.name].sum += d.percentage
        driveTotals[d.name].count += 1
      }
    }
  }
  const driveAverages = DRIVE_KEYS.map(key => ({
    name: key,
    average: driveTotals[key].count > 0 ? Math.round(driveTotals[key].sum / driveTotals[key].count) : 0,
  }))

  // Per company assessment count
  const profileCompanyMap: Record<string, string> = {}
  for (const p of profiles) {
    if (p.company_id) profileCompanyMap[p.id] = p.company_id
  }
  const companyNameMap: Record<string, string> = {}
  for (const c of companies) companyNameMap[c.id] = c.name

  const companyAssessmentMap: Record<string, { count: number; lastDate: string | null }> = {}
  for (const a of assessments) {
    const companyId = profileCompanyMap[a.profile_id]
    if (!companyId) continue
    if (!companyAssessmentMap[companyId]) companyAssessmentMap[companyId] = { count: 0, lastDate: null }
    companyAssessmentMap[companyId].count += 1
    const date = a.assessment_date || a.created_at
    if (date && (!companyAssessmentMap[companyId].lastDate || date > companyAssessmentMap[companyId].lastDate!)) {
      companyAssessmentMap[companyId].lastDate = date
    }
  }
  const companyStats = Object.entries(companyAssessmentMap)
    .map(([companyId, stats]) => ({
      companyId,
      companyName: companyNameMap[companyId] ?? '未知企業',
      count: stats.count,
      lastDate: stats.lastDate ? stats.lastDate.slice(0, 10) : null,
    }))
    .sort((a, b) => b.count - a.count)

  // Analyst productivity
  const analystMap: Record<string, { total: number; completed: number }> = {}
  for (const c of cases) {
    if (!c.analyst_id) continue
    if (!analystMap[c.analyst_id]) analystMap[c.analyst_id] = { total: 0, completed: 0 }
    analystMap[c.analyst_id].total += 1
    if (c.status === 'completed' || c.status === 'done') analystMap[c.analyst_id].completed += 1
  }
  const analystNameMap: Record<string, string> = {}
  for (const p of profiles) analystNameMap[p.id] = p.full_name || p.email || '未知'

  const analystStats = Object.entries(analystMap)
    .map(([analystId, stats]) => ({
      analystId,
      name: analystNameMap[analystId] ?? '未知',
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const uniqueAnalysts = Object.keys(analystMap).length
  const coveredCompanies = Object.keys(companyAssessmentMap).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">皮紋評量分析</h1>
      <p className="text-gray-500 text-sm mb-6">皮紋評量商業價值總覽 - 評量趨勢、天賦分布、企業涵蓋</p>
      <TalentAnalyticsClient
        totalAssessments={totalAssessments}
        thisMonthCount={thisMonthCount}
        analystCount={uniqueAnalysts}
        companyCount={coveredCompanies}
        monthlyTrend={monthlyTrend}
        patternDistribution={patternDistribution}
        driveAverages={driveAverages}
        companyStats={companyStats}
        analystStats={analystStats}
      />
    </div>
  )
}
