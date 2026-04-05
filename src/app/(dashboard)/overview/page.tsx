import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { getWorkspaceStats } from '@/lib/get-workspace-stats'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OverviewFilter } from '@/components/overview/overview-filter'

export const metadata = { title: '企業總表 | ID3A 管理平台' }

const CONTRACT_STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'danger' }> = {
  negotiating: { label: '洽談中', variant: 'default' },
  signed: { label: '已簽約', variant: 'info' },
  active: { label: '執行中', variant: 'success' },
  closed: { label: '已結案', variant: 'default' },
  terminated: { label: '已終止', variant: 'danger' },
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; company?: string; plan?: string }>
}) {
  const { year: filterYear, company: filterCompany, plan: filterPlan } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()

  // 企業列表
  let companiesQuery = sc.from('companies').select('id, name, status').order('name')
  const { data: companies } = await companiesQuery

  const filteredCompanies = filterCompany
    ? companies?.filter((c) => c.id === filterCompany) ?? []
    : companies ?? []

  // 所有提案
  const { data: allProposals } = await sc.from('company_proposals').select('*').order('year', { ascending: false })

  // 計畫
  const { data: trainingPlans } = await sc.from('training_plans').select('id, name').eq('is_active', true).order('name')
  const planMap: Record<string, string> = {}
  trainingPlans?.forEach((p) => { planMap[p.id] = p.name })

  // 所有合約
  let contractQuery = sc.from('company_contracts').select('*').order('created_at', { ascending: false })
  if (filterPlan) contractQuery = contractQuery.eq('plan_id', filterPlan)
  const { data: allContracts } = await contractQuery

  // 彙整每家企業的資料
  const rows: {
    companyId: string
    companyName: string
    year: number | null
    proposalName: string | null
    planName: string | null
    applied: number | null
    approved: number | null
    reimbursed: number | null
    contractStatus: string | null
    pddro: number
  }[] = []

  for (const company of filteredCompanies) {
    const stats = await getWorkspaceStats(company.id)
    const companyProposals = allProposals?.filter((p) => p.company_id === company.id) ?? []
    const companyContracts = allContracts?.filter((c) => c.company_id === company.id) ?? []
    const latestContract = companyContracts[0]
    const contractPlanName = latestContract?.plan_id ? planMap[latestContract.plan_id] ?? null : null

    // 如果有計畫篩選，但企業沒有匹配的合約，跳過
    if (filterPlan && !companyContracts.some((c) => c.plan_id === filterPlan)) continue

    if (companyProposals.length > 0) {
      for (const p of companyProposals) {
        if (filterYear && p.year !== parseInt(filterYear)) continue
        rows.push({
          companyId: company.id,
          companyName: company.name,
          year: p.year,
          proposalName: p.proposal_name,
          planName: contractPlanName,
          applied: p.applied_amount,
          approved: p.approved_amount,
          reimbursed: p.reimbursed_amount,
          contractStatus: latestContract?.status ?? null,
          pddro: stats.overallPddro,
        })
      }
    } else if (!filterYear) {
      rows.push({
        companyId: company.id,
        companyName: company.name,
        year: null,
        proposalName: null,
        planName: contractPlanName,
        applied: null, approved: null, reimbursed: null,
        contractStatus: latestContract?.status ?? null,
        pddro: stats.overallPddro,
      })
    }
  }

  const allYears = [...new Set(allProposals?.map((p) => p.year) ?? [])].sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear)

  const fmt = (n: number | null) => n != null ? `NT$ ${n.toLocaleString()}` : '—'

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">企業總表</h1>

      <div className="mb-5">
        <OverviewFilter
          years={allYears}
          companies={companies ?? []}
          plans={trainingPlans ?? []}
          currentYear={filterYear ?? ''}
          currentCompany={filterCompany ?? ''}
          currentPlan={filterPlan ?? ''}
        />
      </div>

      <Card>
        <CardHeader>
          <p className="font-semibold text-gray-900">跨企業年度數據（{rows.length} 筆）</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">企業</th>
                <th className="px-4 py-2 text-left">計畫</th>
                <th className="px-4 py-2 text-center">年度</th>
                <th className="px-4 py-2 text-left">提案名稱</th>
                <th className="px-4 py-2 text-right">申請金額</th>
                <th className="px-4 py-2 text-right">核定金額</th>
                <th className="px-4 py-2 text-right">核銷金額</th>
                <th className="px-4 py-2 text-center">合約狀態</th>
                <th className="px-4 py-2 text-center">PDDRO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">尚無資料</td></tr>
              ) : (
                rows.map((row, i) => {
                  const cst = row.contractStatus ? CONTRACT_STATUS[row.contractStatus] : null
                  return (
                    <tr key={`${row.companyId}-${row.year}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/companies/${row.companyId}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                          {row.companyName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.planName ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-mono">{row.year ?? '—'}</td>
                      <td className="px-4 py-3">{row.proposalName ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{fmt(row.applied)}</td>
                      <td className="px-4 py-3 text-right">{fmt(row.approved)}</td>
                      <td className="px-4 py-3 text-right text-indigo-600 font-medium">{fmt(row.reimbursed)}</td>
                      <td className="px-4 py-3 text-center">
                        {cst ? <Badge variant={cst.variant}>{cst.label}</Badge> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono ${row.pddro > 0 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                          {row.pddro}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
