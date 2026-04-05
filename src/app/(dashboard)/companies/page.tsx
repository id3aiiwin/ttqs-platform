import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TTQS_LEVELS } from '@/lib/utils'
import type { Company } from '@/types/database'

export const metadata = { title: '企業管理 | ID3A 管理平台' }

function statusBadge(status: Company['status']) {
  if (status === 'active') return <Badge variant="success">輔導中</Badge>
  if (status === 'pending') return <Badge variant="warning">待確認</Badge>
  return <Badge variant="default">已結案</Badge>
}

export default async function CompaniesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">共 {companies?.length ?? 0} 家企業</p>
        </div>
        <Link href="/companies/new">
          <Button>+ 新增企業</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {!companies || companies.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-400 text-sm">尚無企業資料</p>
              <Link href="/companies/new" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                新增第一家企業
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">企業名稱</th>
                  <th className="px-6 py-3 text-left">產業</th>
                  <th className="px-6 py-3 text-left">聯絡人</th>
                  <th className="px-6 py-3 text-left">狀態</th>
                  <th className="px-6 py-3 text-left">TTQS 等級</th>
                  <th className="px-6 py-3 text-left">到期日</th>
                  <th className="px-6 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{company.industry ?? '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{company.contact_person ?? '-'}</td>
                    <td className="px-6 py-4">{statusBadge(company.status)}</td>
                    <td className="px-6 py-4">
                      {company.ttqs_level ? (
                        <Badge variant={company.ttqs_level === 'gold' ? 'warning' : company.ttqs_level === 'silver' ? 'default' : 'info'}>
                          {TTQS_LEVELS[company.ttqs_level].label}
                        </Badge>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{company.ttqs_expiry_date ?? '-'}</td>
                    <td className="px-6 py-4">
                      <Link href={`/companies/${company.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-medium">
                        編輯
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
