import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { ContractListItem } from '@/components/company/contract-list-item'
import { ContractForm } from '@/components/company/contract-form'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '合約管理 | ID3A 管理平台' }

export default async function ContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('id, name').eq('id', id).single()
  if (!company) notFound()

  const { data: contracts } = await sc.from('company_contracts').select('*').eq('company_id', id).order('created_at', { ascending: false })
  const { data: plans } = await sc.from('training_plans').select('id, name').eq('is_active', true).order('name')

  const planMap: Record<string, string> = {}
  plans?.forEach((p) => { planMap[p.id] = p.name })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">合約管理</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <p className="font-semibold text-gray-900">合約列表（{contracts?.length ?? 0} 份）</p>
        </CardHeader>
        {!contracts || contracts.length === 0 ? (
          <CardBody><p className="text-center text-sm text-gray-400 py-8">尚無合約</p></CardBody>
        ) : (
          <div className="divide-y divide-gray-100">
            {contracts.map((c) => (
              <ContractListItem key={c.id} contract={c} companyId={id} plans={plans ?? []} planMap={planMap} />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader><p className="font-semibold text-gray-900">新增合約</p></CardHeader>
        <CardBody>
          <ContractForm companyId={id} plans={plans ?? []} />
        </CardBody>
      </Card>
    </div>
  )
}
