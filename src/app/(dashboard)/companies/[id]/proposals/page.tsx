import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProposalForm } from '@/components/company/proposal-form'

export const metadata = { title: '年度提案 | ID3A 管理平台' }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  planning: { label: '規劃中', variant: 'default' },
  submitted: { label: '已送審', variant: 'info' },
  approved: { label: '核定通過', variant: 'success' },
  active: { label: '執行中', variant: 'warning' },
  closed: { label: '已結案', variant: 'default' },
  rejected: { label: '未通過', variant: 'danger' },
}

export default async function ProposalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string }>
}) {
  const { id } = await params
  const { year: filterYear } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  const isConsultant = profile?.role === 'consultant'

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('id, name').eq('id', id).single()
  if (!company) notFound()

  let query = sc.from('company_proposals').select('*').eq('company_id', id).order('year', { ascending: false })
  if (filterYear) query = query.eq('year', parseInt(filterYear))
  const { data: proposals } = await query

  // 取得可用年度
  const years = [...new Set(proposals?.map((p) => p.year) ?? [])].sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  if (!years.includes(currentYear)) years.unshift(currentYear)

  const fmt = (n: number | null) => n != null ? `NT$ ${n.toLocaleString()}` : '—'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">年度提案與經費</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      {/* 年度篩選 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm text-gray-500">年度：</span>
        <Link href={`/companies/${id}/proposals`}
          className={`text-sm px-3 py-1 rounded-lg ${!filterYear ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
          全部
        </Link>
        {years.map((y) => (
          <Link key={y} href={`/companies/${id}/proposals?year=${y}`}
            className={`text-sm px-3 py-1 rounded-lg ${filterYear === String(y) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
            {y}
          </Link>
        ))}
      </div>

      {/* 提案列表 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">提案列表</p></CardHeader>
        {!proposals || proposals.length === 0 ? (
          <CardBody><p className="text-center text-sm text-gray-400 py-8">尚無提案</p></CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-2 text-left">年度</th>
                  <th className="px-5 py-2 text-left">計畫名稱</th>
                  <th className="px-5 py-2 text-right">申請金額</th>
                  <th className="px-5 py-2 text-right">核定金額</th>
                  {isConsultant && <th className="px-5 py-2 text-right">核銷金額</th>}
                  <th className="px-5 py-2 text-center">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proposals.map((p) => {
                  const st = STATUS_MAP[p.status] ?? STATUS_MAP.planning
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-gray-500">{p.year}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{p.proposal_name}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmt(p.applied_amount)}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{fmt(p.approved_amount)}</td>
                      {isConsultant && (
                        <td className="px-5 py-3 text-right text-indigo-600 font-medium">{fmt(p.reimbursed_amount)}</td>
                      )}
                      <td className="px-5 py-3 text-center"><Badge variant={st.variant}>{st.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 新增（顧問） */}
      {isConsultant && (
        <Card>
          <CardHeader><p className="font-semibold text-gray-900">新增提案</p></CardHeader>
          <CardBody>
            <ProposalForm companyId={id} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
